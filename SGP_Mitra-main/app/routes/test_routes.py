from app import create_app
from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection , chats_collection
from app.utils.mail import send_reset_email
import secrets
from app.routes import test_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  *
from authlib.integrations.flask_client import OAuth
import certifi
import uuid

@test_routes.route("/store_test_score", methods=["POST"])
def store_test_score():
    try:
        data = request.get_json()
        if not data or "access_token" not in data or "test_score" not in data:
            return jsonify({"msg": "Bad Request: Missing required fields"}), 400

        access_token = data["access_token"]
        print(access_token)
        test_score = int(data["test_score"])
        print(test_score)

        timestamp = datetime.now(timezone.utc)
        print(timestamp)

        # Decode JWT token
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        print(email)
        
        if not email:
            return jsonify({"msg": "Invalid or expired token"}), 401

        # Determine chatbot preference based on test_score
        if test_score <= 4:
            preference = "Minimal Support"
        elif test_score <= 9:
            preference = "Mild Support"
        elif test_score <= 14:
            preference = "Moderate Support"
        elif test_score <= 19:
            preference = "High Support"
        else:
            preference = "Critical Support"
        

        print(preference)
        # Fetch the user from the database
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Ensure test_results is a dictionary
        # test_results = user.get("test_results")
        
        # Store the new test score with a timestamp
        # test_results = {"PHQ-9": test_score, "chatbot_preference": preference , "timestamp": timestamp}
        
        # Update user test_results in the database
        update_result = users_collection.update_one(
            {"email": email},
            {
                "$push": {"test_results": {  # Add to the array
                    "timestamp": timestamp,
                    "PHQ-9": test_score,
                    "chatbot_preference": preference
                }},
                "$set": {"chatbot_preference": preference}  # Store separately
            }
        )
        if update_result.modified_count == 0:
            return jsonify({"msg": "No changes made"}), 400

        return jsonify({"msg": "Test score stored successfully", "chatbot_preference": preference}), 200
    
    except Exception as e:
        return jsonify({"msg": "Error storing test score", "error": str(e)}), 500
    