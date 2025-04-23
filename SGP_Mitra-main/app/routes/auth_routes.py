from app import create_app
from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection , chats_collection
from app.utils.mail import send_reset_email
import secrets
from app.routes import auth_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  *
from authlib.integrations.flask_client import OAuth
import certifi
import uuid
from flask import Flask, redirect, url_for, session, request, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user
from requests_oauthlib import OAuth2Session
import uuid
import os
import random

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP for local development

client_id = '116911782936-rbs2fo9mnu82trsgk29afhih35ibr9mt.apps.googleusercontent.com'
client_secret = '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'
authorization_base_url = 'https://accounts.google.com/o/oauth2/auth'
token_url = 'https://accounts.google.com/o/oauth2/token'
redirect_uri = 'http://127.0.0.1:5000/api/v1/callback'
scope = ['profile', 'email']

# User Registration
@auth_routes.route("/register", methods=["POST"])
def register():
    user = request.get_json()

    if not is_valid_username(user["username"]):
        return jsonify({"msg": "Username must be at least 5 characters long, start with a letter, and contain only letters, numbers, or underscores"}), 400
    
    if verify_username(user["username"]):
        return jsonify({"msg": "Username already exists"}), 400
    
    if not is_valid_email(user["email"]):
        return jsonify({"msg": "Invalid email format"}), 400

    if not is_strong_password(user["password"]):
        return jsonify({"msg": "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character"}), 400

    if users_collection.find_one({"email": user["email"]}):
        return jsonify({"msg": "Email already registered"}), 409
    
    hashed_password = generate_hash_password(user["password"])

    user_id = str(uuid.uuid4())

    new_user = {
        "user_id": user_id,  
        "full_name": user["full_name"],
        "email": user["email"],
        "username": user["username"],
        "password": hashed_password,
        "gender": "Unspecified",
        "phone_number":"Unspecified",
        "country":"Unspecified",
        "test_results": [],  
        "chatbot_preference": "Mild_support"
    }

    users_collection.insert_one(new_user)
    access_token = generate_token(user["email"])

    response = make_response(jsonify({"msg": f"{user['username']} registered successfully", "user_id": user_id}))
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="None")  

    # print(response.headers)
    return response, 201



# User Login
@auth_routes.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = users_collection.find_one({
        "$or": [
            {"email": data["email_or_username"]},
            {"username": data["email_or_username"]}
        ]
    })

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Check for too many failed login attempts
    if user.get("failed_attempts", 0) >= 5:
        return jsonify({"msg": "Account locked due to multiple failed login attempts. Try again later."}), 403

    # Verify password
    if verify_password(data["password"], user["password"]):

        # Reset failed attempts
        users_collection.update_one({"email": user["email"]}, {"$set": {"failed_attempts": 0}})

        # Generate tokens
        access_token = generate_token(user["email"])
        user_id = user["user_id"]  # Fetch user_id from DB

        # Create response with secure HTTP-only cookies
        response = make_response(jsonify({"msg": "Login successful", "access_token": access_token, "user_id": user_id}), 200)
        response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="None")
        response.set_cookie("user_id", user_id, httponly=True, secure=False, samesite="None")

        print(response.headers)

        return response
    
    # Increment failed attempts if password is incorrect
    users_collection.update_one({"email": user["email"]}, {"$inc": {"failed_attempts": 1}})
    return jsonify({"msg": "Incorrect password"}), 401




# Forgot Password
@auth_routes.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()

    
    field="email"
    user = users_collection.find_one({"email": data["email"]})

    if not user:
        user = users_collection.find_one({"username": data["email"]})
        field="username"

    if not user:
        return jsonify({"msg": "Not a valid Email/Username"}), 404


    reset_token = secrets.token_urlsafe(32)
    hashed_reset_token = generate_hash_token(reset_token)
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10) 
    
    if(field=="email"):
        users_collection.update_one(
        {"email": data["email"]},
        {"$set": {"reset_token": hashed_reset_token, "reset_token_expiry": expiration_time}}
    )

        send_reset_email(data["email"], reset_token)
        return jsonify({"msg": f"Password reset email sent to {data['email']}"}), 200

    if(field=="username"):

    
        users_collection.update_one(
            {"username": data["email"]},
            {"$set": {"reset_token": hashed_reset_token, "reset_token_expiry": expiration_time}}
        )

        user = users_collection.find_one({"username": data["email"]})

        send_reset_email(user["email"], reset_token)
        return jsonify({"msg": f"Password reset email sent to {user['email']}"}), 200


@auth_routes.route("/reset-password/<token>", methods=["POST"])
# @jwt_required
def reset_password(token):

    hashed_token = generate_hash_token(token)


    data = request.get_json()
    user = users_collection.find_one({"reset_token": hashed_token})

    if not user:
        return jsonify({"msg": "Invalid or expired token"}), 400

    if "reset_token_expiry" in user:
        expiry = user["reset_token_expiry"]
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expiry:
        return jsonify({"msg": "Token expired"}), 400

    # Hash the new password
    if(is_strong_password(data["new_password"])):
        hashed_password = generate_hash_password(data["new_password"])

        users_collection.update_one(
        {"email": user["email"]},
        {"$set": {"password": hashed_password}, "$unset": {"reset_token": "", "reset_token_expiry": ""}}
    )

        return jsonify({"msg": "Password updated successfully"}), 200
    else:
        return jsonify({"msg": "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character"}), 400




@auth_routes.route("/login/google", methods=["GET"])
def login_google():
    google = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=scope)
    authorization_url, state = google.authorization_url(authorization_base_url, access_type='offline', prompt='select_account')
    session['oauth_state'] = state
    return redirect(authorization_url)


@auth_routes.route("/callback" , methods = ["GET"])
def callback():
    google = OAuth2Session(client_id, state=session.get('oauth_state'), redirect_uri=redirect_uri)
    print("Fetching token...")
    token = google.fetch_token(token_url, client_secret=client_secret, authorization_response=request.url)
    print(f"Token received: {token}")

    print("Fetching user info...")
    user_info = google.get('https://www.googleapis.com/oauth2/v1/userinfo').json()
    print(f"User Info: {user_info}")



    # Fetch user info from Google
    # user_info = google.get('https://www.googleapis.com/oauth2/v1/userinfo').json()

    email = user_info.get("email")
    full_name = user_info.get("name", "")
    first_name = user_info.get("given_name", "")
    
    # Check if user exists in the database
    existing_user = users_collection.find_one({'email': email})
    print(f"Existing user: {existing_user}")


    if not existing_user:
        print("New user detected, creating profile...")
        user_id = str(uuid.uuid4())
        username = f"{first_name}_{random.randint(1000, 9999)}"
        
        new_user = {
            "user_id": user_id,
            "full_name": full_name,
            "email": email,
            "username": username,
            "password": "hashed_password",  # Replace with actual hashing if needed
            "gender": "Unspecified",
            "phone_number": "Unspecified",
            "country": "Unspecified",
            "test_results": [],
            "chatbot_preference": "Mild_support"
        }

        users_collection.insert_one(new_user)
        print("User successfully added to the database.")
        # access_token = generate_token(email)
        access_token = generate_token(email)
        print(f'Email: {email}')
        print(f'full name: {full_name}')
        print(f'First name: {first_name}')
        print(f"Generated Access Token: {access_token}")
        response = make_response(jsonify({"message": "Login successful" , "access_token" : access_token}))
        response.set_cookie("access_token", access_token, httponly=False, secure=False, samesite="None")  
        print("Cookies set")
        response.headers["Location"] = f"http://localhost:3000/home/?access_token={access_token}"
        response.status_code = 302 
        return response
    
    access_token = generate_token(email)
    print(f'Email: {email}')
    print(f'full name: {full_name}')
    print(f'First name: {first_name}')
    print(f"Generated Access Token: {access_token}")
    response = make_response(jsonify({"message": "Login successful" , "access_token" : access_token}))
    print("Existing User")
    response.set_cookie("access_token", access_token, httponly=False, secure=False, samesite="None")  
    print("Cookies set")
    response.headers["Location"] = f"http://localhost:3000/home/?access_token={access_token}"
    response.status_code = 302 


    return response





# @auth_routes.route("/api/chat", methods=["POST"])
# def chat():

#     data = request.get_json()
#     message = data["message"]
#     print(message)

#     if "access_token" in data and data["access_token"]:
#         access_token = data["access_token"]
#         decoded_token = decode_token(access_token)
#         email = decoded_token.get("sub")
#         user = users_collection.find_one({"email": email})

#         chatbot_preference = user["chatbot_preference"]
#         username = user["full_name"]
#         print(username)
#         response_text  , sentiment_score = generate_llm_response_sentiment(message , chatbot_preference , username)
#         print(response_text)
#         chat_entry = {
#         "user_id": user["user_id"],
#         "user_message": message,
#         "bot_response": response_text,
#         "timestamp": datetime.now(timezone.utc),
#         "sentiment_score" : sentiment_score
#         }
#         chats_collection.insert_one(chat_entry)

#         return jsonify({"reply": response_text , "sentiment_score": sentiment_score} )


#     response_text  , sentiment_score = generate_llm_response_sentiment(message , None , None)
#     # user_id = request.cookies.get("user_id")  # Fetch user_id from cookies

#     # if not user_id:
#     #     print("Did not find the user_id")
#     #     return jsonify({"error": "Unauthorized"}), 401


#     user_id = str(uuid.uuid4())
#     chat_entry = {
#         "user_id": user_id,
#         "user_message": message,
#         "bot_response": response_text,
#         "timestamp": datetime.now(timezone.utc),
#         "sentiment_score" : sentiment_score
#     }

#     chats_collection.insert_one(chat_entry)

#     return jsonify({"reply": response_text , "sentiment_score": sentiment_score} )





# @auth_routes.route("/get-username", methods=["POST"])
# def get_username():
#     try:
#         data = request.get_json()  # Get JSON payload from request
#         if not data or "access_token" not in data:
#             return jsonify({"msg": "Unauthorized: No token provided"}), 401

#         access_token = data["access_token"]  # Extract access_token
#         decoded_token = decode_token(access_token)  # Decode the JWT token
#         email = decoded_token.get("sub")  # Extract email from token
        
#         if not email:
#             return jsonify({"msg": "Invalid or expired token"}), 401
        
#         # Fetch user from database using the extracted email
#         user = users_collection.find_one({"email": email})
#         if not user:
#             return jsonify({"msg": "User not found"}), 404
        
#         return jsonify({"username": user.get("username")}), 200
    
#     except Exception as e:
#         return jsonify({"msg": "Error retrieving username", "error": str(e)}), 500


# @auth_routes.route("/profile", methods=["POST"])
# def get_profile():
#     try:
#         data = request.get_json()
#         if not data or "access_token" not in data:
#             return jsonify({"msg": "Unauthorized: No token provided"}), 401

#         access_token = data["access_token"]
#         decoded_token = decode_token(access_token)
#         email = decoded_token.get("sub")

#         if not email:
#             return jsonify({"msg": "Invalid or expired token"}), 401
        
#         # Fetch user from database using the extracted email
#         user = users_collection.find_one({"email": email})
#         if not user:
#             return jsonify({"msg": "User not found"}), 404
        
#         user_data = {
#             "_id": str(user["_id"]),
#             "user_id": user["user_id"],
#             "full_name": user["full_name"],
#             "email": user["email"],
#             "username": user["username"],
#             "test_results": user["test_results"],
#             "chatbot_preference": user["chatbot_preference"],
#             "country": user.get("country", ""),  # Use .get() with a default value
#             "gender": user.get("gender", ""),
#             "phone_number": user.get("phone_number", "")
#         }

#         return jsonify(user_data), 200
    
#     except Exception as e:
#         return jsonify({"msg": "Error retrieving profile", "error":str(e)}), 500


# @auth_routes.route("/store_test_score", methods=["POST"])
# def store_test_score():
#     try:
#         data = request.get_json()
#         if not data or "access_token" not in data or "test_score" not in data:
#             return jsonify({"msg": "Bad Request: Missing required fields"}), 400

#         access_token = data["access_token"]
#         print(access_token)
#         test_score = int(data["test_score"])
#         print(test_score)

#         timestamp = datetime.now(timezone.utc)
#         print(timestamp)

#         # Decode JWT token
#         decoded_token = decode_token(access_token)
#         email = decoded_token.get("sub")
#         print(email)
        
#         if not email:
#             return jsonify({"msg": "Invalid or expired token"}), 401

#         # Determine chatbot preference based on test_score
#         if test_score <= 4:
#             preference = "Minimal Support"
#         elif test_score <= 9:
#             preference = "Mild Support"
#         elif test_score <= 14:
#             preference = "Moderate Support"
#         elif test_score <= 19:
#             preference = "High Support"
#         else:
#             preference = "Critical Support"
        

#         print(preference)
#         # Fetch the user from the database
#         user = users_collection.find_one({"email": email})
#         if not user:
#             return jsonify({"msg": "User not found"}), 404

#         # Ensure test_results is a dictionary
#         # test_results = user.get("test_results")
        
#         # Store the new test score with a timestamp
#         # test_results = {"PHQ-9": test_score, "chatbot_preference": preference , "timestamp": timestamp}
        
#         # Update user test_results in the database
#         update_result = users_collection.update_one(
#             {"email": email},
#             {
#                 "$push": {"test_results": {  # Add to the array
#                     "timestamp": timestamp,
#                     "PHQ-9": test_score,
#                     "chatbot_preference": preference
#                 }},
#                 "$set": {"chatbot_preference": preference}  # Store separately
#             }
#         )
#         if update_result.modified_count == 0:
#             return jsonify({"msg": "No changes made"}), 400

#         return jsonify({"msg": "Test score stored successfully", "chatbot_preference": preference}), 200
    
#     except Exception as e:
#         return jsonify({"msg": "Error storing test score", "error": str(e)}), 500
    



# @auth_routes.route("/update_profile", methods=["POST"])
# def update_profile():
#     try:
#         data = request.get_json()
#         if not data or "access_token" not in data:
#             return jsonify({"msg": "Unauthorized: No token provided"}), 401

#         access_token = data["access_token"]
#         decoded_token = decode_token(access_token)
#         email = decoded_token.get("sub")

#         if not email:
#             return jsonify({"msg": "Invalid or expired token"}), 401

#          # Extract profile update fields
#         update_fields = {
#             "full_name": data.get("full_name"),
#             "username": data.get("username"),
#             "gender": data.get("gender"),
#             "country": data.get("country"),
#             "phone_number": data.get("phone_number")
#         }

#         # Remove None values
#         update_fields = {k: v for k, v in update_fields.items() if v is not None}

#         # Update user in database
#         result = users_collection.update_one(
#             {"email": email},
#             {"$set": update_fields}
#         )

#         if result.modified_count > 0:
#             # Fetch updated user data
#             updated_user = users_collection.find_one({"email": email})
            
#             # Prepare user data response
#             user_data = {
#                 "full_name": updated_user.get("full_name"),
#                 "username": updated_user.get("username"),
#                 "email": updated_user.get("email"),
#                 "gender": updated_user.get("gender"),
#                 "country": updated_user.get("country"),
#                 "phone_number": updated_user.get("phone_number")
#             }

#             return jsonify({
#                 "msg": "Profile updated successfully", 
#                 "user_data": user_data
#             }), 200
#         else:
#             return jsonify({"msg": "No changes were made"}), 200

#     except Exception as e:
#         return jsonify({"msg": "Error updating profile", "error": str(e)}), 500

