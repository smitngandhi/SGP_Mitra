from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection 
from app.utils.mail import send_reset_email
from app.utils.logger_utils import get_logger
import secrets
from app.routes import auth_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  generate_hash_password, verify_password, generate_hash_token, generate_token , is_valid_username, is_valid_email, is_strong_password, verify_username
import uuid
from flask import redirect, session, request, jsonify
from requests_oauthlib import OAuth2Session
import uuid
import os
import random
from dotenv import load_dotenv


# Initialize logger
logger = get_logger(__name__)
logger.debug("[DEBUG] Logger Defined for auth_routes")

load_dotenv()
logger.info("[INFO] Loading environment variables from .env file")


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP for local development
logger.warning("[WARNING] OAuth insecure transport enabled for local development")

# OAuth Configuration
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
authorization_base_url = os.getenv('AUTHORIZATION_BASE_URL')
token_url = os.getenv('TOKEN_URL')
redirect_uri = os.getenv('REDIRECT_URL')

scope = ['profile', 'email']

logger.info("[DEBUG] OAuth configuration loaded successfully")
logger.debug(f"[DEBUG] OAuth redirect URI: {redirect_uri}")
logger.debug(f"[DEBUG] OAuth scopes: {scope}")

# User Registration
@auth_routes.route("/register", methods=["POST"])
def register():
    
    try:
        user = request.get_json()
        logger.info(f"Registration attempt for username: {user.get('username', 'N/A')}")
        logger.debug(f"Registration data received: {list(user.keys()) if user else 'None'}")

        if not user:
            logger.warning("[WARNING] Registration failed: No JSON data received")
            return jsonify({"msg": "No data provided"}), 400

        # Username validation
        if not is_valid_username(user["username"]):
            logger.warning(f"[WARNING] Registration failed: Invalid username format for {user['username']}")
            return jsonify({"msg": "Username must be at least 5 characters long, start with a letter, and contain only letters, numbers, or underscores"}), 400
        
        if verify_username(user["username"]):
            logger.warning(f"[WARNING] Registration failed: Username {user['username']} already exists")
            return jsonify({"msg": "Username already exists"}), 400
        
        # Email validation
        if not is_valid_email(user["email"]):
            logger.warning(f"[WARNING] Registration failed: Invalid email format for {user['email']}")
            return jsonify({"msg": "Invalid email format"}), 400
        
        if users_collection.find_one({"email": user["email"]}):
            logger.warning(f"[WARNING] Registration failed: Email {user['email']} already registered")
            return jsonify({"msg": "Email already registered"}), 409

        # Password validation
        if not is_strong_password(user["password"]):
            logger.warning(f"[WARNING] Registration failed: Weak password for user {user['username']}")
            return jsonify({"msg": "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character"}), 400

        logger.debug("[DEBUG] All validations passed, proceeding with user creation")
        
        hashed_password = generate_hash_password(user["password"])
        logger.debug('[DEBUG] Password hashed successfully')
        user_id = str(uuid.uuid4())
        logger.debug(f"[DEBUG] Generated user_id: {user_id}")

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

        logger.info(f"[INFO] Inserting new user into database: {user['username']}")
        users_collection.insert_one(new_user)
        logger.info(f"[INFO] User {user['username']} successfully inserted into database")
        
        access_token = generate_token(user["email"])
        logger.info(f"[INFO] Access token generated for user: {user['username']}")

        response = make_response(jsonify({"msg": f"{user['username']} registered successfully", "user_id": user_id}))
        response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="None")  
        
        logger.info(f"[INFO] User registration completed successfully for: {user['username']}")
    
        return response, 201
        
    except KeyError as e:
        logger.error(f"[ERROR] Registration failed: Missing required field {str(e)}")
        return jsonify({"msg": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        logger.exception(f"[EXCEPTION] Registration failed: {str(e)}")
        return jsonify({"msg": "Internal server error during registration"}), 500



# User Login
@auth_routes.route("/login", methods=["POST"])
def login():
    
    try:
        data = request.get_json()
        login_identifier = data.get("email_or_username", "N/A")
        logger.info(f"[INFO] Login attempt for: {login_identifier}")
        logger.debug(f"[DEBUG] Login data keys received: {list(data.keys()) if data else 'None'}")

        if not data:
            logger.warning("[WARNING] Login failed: No JSON data received")
            return jsonify({"msg": "No data provided"}), 400

        logger.debug(f"[DEBUG] Searching for user with identifier: {login_identifier}")
        user = users_collection.find_one({
            "$or": [
                {"email": data["email_or_username"]},
                {"username": data["email_or_username"]}
            ]
        })

        if not user:
            logger.warning(f"[WARNING] Login failed: User not found for identifier: {login_identifier}")
            return jsonify({"msg": "User not found"}), 404

        logger.debug(f"[DEBUG] User found: {user['username']} (ID: {user['user_id']})")
        
        # Check for too many failed login attempts
        failed_attempts = user.get("failed_attempts", 0)
        if failed_attempts >= 5:
            logger.error(f"[ERROR] Login blocked: Account locked for user {user['username']} due to {failed_attempts} failed attempts")
            return jsonify({"msg": "Account locked due to multiple failed login attempts. Try again later."}), 403

        logger.debug(f"[DEBUG] Current failed attempts for {user['username']}: {failed_attempts}")
        
        # Verify password
        if verify_password(data["password"], user["password"]):
            logger.info(f"[INFO] Password verification successful for user: {user['username']}")

            # Reset failed attempts
            if failed_attempts > 0:
                logger.info(f"[INFO] Resetting failed attempts for user: {user['username']}")
                users_collection.update_one({"email": user["email"]}, {"$set": {"failed_attempts": 0}})

            # Generate tokens
            access_token = generate_token(user["email"])
            user_id = user["user_id"]
            logger.debug(f"[DEBUG] Access token generated for user: {user['username']}")

            # Create response with secure HTTP-only cookies
            response = make_response(jsonify({"msg": "Login successful", "access_token": access_token, "user_id": user_id}), 200)
            response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="None")
            response.set_cookie("user_id", user_id, httponly=True, secure=False, samesite="None")

            logger.info(f"[INFO] Login successful for user: {user['username']} (ID: {user_id})")
            return response
        else:
            # Increment failed attempts if password is incorrect
            new_failed_attempts = failed_attempts + 1
            logger.warning(f"[WARNING] Login failed: Incorrect password for user {user['username']} (attempt #{new_failed_attempts})")
            users_collection.update_one({"email": user["email"]}, {"$inc": {"failed_attempts": 1}})
            
            if new_failed_attempts >= 5:
                logger.error(f"[ERROR] Account will be locked after this attempt for user: {user['username']}")
            
            return jsonify({"msg": "Incorrect password"}), 401
            
    except KeyError as e:
        logger.error(f"[ERROR] Login failed: Missing required field {str(e)}")
        return jsonify({"msg": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        logger.exception(f"[EXCEPTION] Login failed: {str(e)}")
        return jsonify({"msg": "Internal server error during login"}), 500




# Forgot Password
@auth_routes.route("/forgot-password", methods=["POST"])
def forgot_password():
    
    try:
        # Get the user data
        data = request.get_json()
        identifier = data.get("email_or_username", "N/A")
        logger.info(f"[INFO] Password reset request for: {identifier}")
        logger.debug(f"[DEBUG] Forgot password data keys: {list(data.keys()) if data else 'None'}")

        if not data:
            logger.warning("[WARNING] Forgot password failed: No JSON data received")
            return jsonify({"msg": "No data provided"}), 400

        # Find the user based on email or username
        logger.debug(f"[DEBUG] Searching for user with identifier: {identifier}")
        user = users_collection.find_one({
            "$or": [
                {"email": data["email_or_username"]},
                {"username": data["email_or_username"]}
            ]
        })

        # Return if not a valid username/Email
        if not user:
            logger.warning(f"[WARNING] Password reset failed: Invalid email/username: {identifier}")
            return jsonify({"msg": "Not a valid Email/Username"}), 404

        logger.info(f"[INFO] User found for password reset: {user['username']} ({user['email']})")

        # Generate a random reset token
        reset_token = secrets.token_urlsafe(32)
        logger.debug(f"[DEBUG] Generated reset token for user: {user['username']}")

        # Hash the token
        hashed_reset_token = generate_hash_token(reset_token)
        logger.debug(f"[DEBUG] Reset token hashed for user: {user['username']}")

        # Set the expiration time (here 10 minutes)
        expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)
        logger.debug(f"[DEBUG] token expiration set to: {expiration_time} for user: {user['username']}") 
    

        # Update the server with the hashed token and expiration token
        logger.info(f"[INFO] Updating database with reset token for user: {user['username']}")
        users_collection.update_one(
            {"email": user["email"]},
            {
                "$set": {
                    "reset_token": hashed_reset_token,
                    "reset_token_expiry": expiration_time
                }
            }
        )
        logger.debug(f"[DEBUG] Database updated with reset token for user: {user['username']}")

        # Send the reset link to our mail for resetting password
        logger.info(f"[INFO] Sending password reset email to: {user['email']}")
        send_reset_email(user['email'], reset_token)
        logger.info(f"[INFO] Password reset email sent successfully to: {user['email']}")
        
        return jsonify({"msg": f"Password reset email sent to {user['email']}"}), 200
        
    except KeyError as e:
        logger.error(f"[ERROR] Forgot password failed: Missing required field {str(e)}")
        return jsonify({"msg": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        logger.exception(f"[EXCEPTION] Forgot password failed: {str(e)}")
        return jsonify({"msg": "Internal server error during password reset"}), 500


@auth_routes.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    
    try:
        logger.info(f"[INFO] Password reset attempt with token: {token[:8]}...")
        hashed_token = generate_hash_token(token)
        logger.debug("[DEBUG] Token hashed for database lookup")

        # Get the new passwords from the user
        data = request.get_json()
        logger.debug(f"[DEBUG] Reset password data keys: {list(data.keys()) if data else 'None'}")
        
        if not data:
            logger.warning("[WARNING] Password reset failed: No JSON data received")
            return jsonify({"msg": "No data provided"}), 400

        # Check if the token is expired or not
        logger.debug("[DEBUG] Looking up user by reset token")
        user = users_collection.find_one({"reset_token": hashed_token})

        # If expired then sends a message
        if not user:
            logger.warning(f"[WARNING] Password reset failed: Invalid or expired token {token[:8]}...")
            return jsonify({"msg": "Invalid or expired token"}), 400

        logger.info(f"User found for password reset: {user['username']} ({user['email']})")

        # Fetches the expiry time of time
        if "reset_token_expiry" in user:
            expiry = user["reset_token_expiry"]
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            logger.debug(f"[DEBUG] Token expiry time: {expiry}")
        else:
            logger.error(f"[ERROR] No expiry time found for reset token for user: {user['username']}")
            return jsonify({"msg": "Invalid token format"}), 400

        # If the expiry time exceeds then Sends a message 
        current_time = datetime.now(timezone.utc)
        if current_time > expiry:
            logger.warning(f"[WARNING] Password reset failed: Token expired for user {user['username']} (expired at {expiry}, current time {current_time})")
            return jsonify({"msg": "Token expired"}), 400

        logger.debug(f"[DEBUG] Token is valid and not expired for user: {user['username']}")

        # Hash the new password
        if is_strong_password(data["new_password"]):
            logger.debug(f"[DEBUG] New password meets strength requirements for user: {user['username']}")
            hashed_password = generate_hash_password(data["new_password"])
            logger.debug(f"[DEBUG] New password hashed for user: {user['username']}")

            # Unsets the reset_token and expiry upon successful change of passwords
            logger.info(f"[INFO] Updating password and clearing reset token for user: {user['username']}")
            users_collection.update_one(
                {"email": user["email"]},
                {"$set": {"password": hashed_password}, "$unset": {"reset_token": "", "reset_token_expiry": ""}}
            )
            logger.info(f"[INFO] Password successfully updated for user: {user['username']}")

            return jsonify({"msg": "Password updated successfully"}), 200
        else:
            logger.warning(f"Password reset failed: Weak password provided for user {user['username']}")
            return jsonify({"msg": "Password must be at least 8 characters long, include a number, an uppercase letter, and a special character"}), 400
            
    except KeyError as e:
        logger.error(f"[ERROR] Password reset failed: Missing required field {str(e)}")
        return jsonify({"msg": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        logger.exception(f"[EXCEPTION] Password reset failed: {str(e)}")
        return jsonify({"msg": "Internal server error during password reset"}), 500



@auth_routes.route("/login/google", methods=["GET"])
def login_google():
    try:
        logger.debug("[DEBUG] Initiating Google OAuth login process")
        google = OAuth2Session(client_id, redirect_uri=redirect_uri, scope=scope)
        authorization_url, state = google.authorization_url(
            authorization_base_url, access_type='offline', prompt='select_account'
        )
        session['oauth_state'] = state
        logger.info("[INFO] Google OAuth authorization URL generated successfully")
        return redirect(authorization_url)
    except Exception as e:
        logger.error(f"[ERROR] Failed during Google login initiation: {str(e)}", exc_info=True)
        return jsonify({"error": "Google login failed"}), 500


@auth_routes.route("/callback", methods=["GET"])
def callback():
    try:
        logger.debug("[DEBUG] Callback initiated for Google OAuth")
        google = OAuth2Session(
            client_id, state=session.get('oauth_state'), redirect_uri=redirect_uri
        )

        token = google.fetch_token(
            token_url, client_secret=client_secret, authorization_response=request.url
        )
        logger.debug("[DEBUG] Token fetched successfully from Google OAuth")
        logger.info("[INFO] Google OAuth token fetched successfully")

        user_info = google.get(
            'https://www.googleapis.com/oauth2/v1/userinfo'
        ).json()
        logger.info("[INFO] User info fetched from Google OAuth")

        email = user_info.get("email")
        full_name = user_info.get("name", "")
        first_name = user_info.get("given_name", "")

        logger.debug(f"[DEBUG] Extracted user info: email={email}, full_name={full_name}, first_name={first_name}")

        existing_user = users_collection.find_one({'email': email})
        logger.debug(f"[DEBUG] Existing user lookup result: {existing_user}")

        if not existing_user:
            logger.info("[INFO] New user detected, creating profile...")
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
            logger.info("[INFO] User successfully added to the database.")

            access_token = generate_token(email)
            logger.debug(f"[DEBUG] Generated access token for new user: {access_token}")

            response = make_response(jsonify({"message": "Login successful", "access_token": access_token}))
            response.set_cookie("access_token", access_token, httponly=False, secure=False, samesite="None")
            logger.debug("[DEBUG] Cookies set for new user")
            response.headers["Location"] = f"http://localhost:3000/login-video?access_token={access_token}"
            response.status_code = 302
            return response

        # If user exists
        logger.info("[INFO] Existing user detected")
        access_token = generate_token(email)
        logger.debug(f"[DEBUG] Generated access token for existing user: {access_token}")

        response = make_response(jsonify({"message": "Login successful", "access_token": access_token}))
        response.set_cookie("access_token", access_token, httponly=False, secure=False, samesite="None")
        logger.debug("[DEBUG] Cookies set for existing user")
        response.headers["Location"] = f"http://localhost:3000/login-video?access_token={access_token}"
        response.status_code = 302
        return response

    except Exception as e:
        logger.error(f"[ERROR] Exception during Google OAuth callback: {str(e)}", exc_info=True)
        return jsonify({"error": "Callback processing failed"}), 500


































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

