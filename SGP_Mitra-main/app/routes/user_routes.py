from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection , chats_collection
from app.utils.mail import send_reset_email
import secrets
from app.routes import user_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  *
from authlib.integrations.flask_client import OAuth
import certifi
import uuid
import cv2
import numpy as np
import pandas as pd
import tensorflow as tf
import json
import os
from flask import Flask, jsonify, request
import ast
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dropout, Flatten, Dense
import os
import torch
import torchaudio
from flask import Flask, request, jsonify, send_from_directory
from transformers import AutoProcessor, MusicgenForConditionalGeneration

model = Sequential()
model.add(Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(48,48,1)))
model.add(Conv2D(64, kernel_size=(3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))
model.add(Flatten())
model.add(Dense(1024, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(7, activation='softmax'))



OUTPUT_DIR = "C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New Odoo\\Mitra_Dhruvil_Branch\\app\\static\\generated_music"
os.makedirs(OUTPUT_DIR, exist_ok=True)


# Load MusicGen model and processor
device = "cuda" if torch.cuda.is_available() else "cpu"
model_musicgen = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small").to(device)
processor = AutoProcessor.from_pretrained("facebook/musicgen-small")

# Load the model weights
model_path = 'C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New SGP\\Mitra_Dhruvil_Branch\\SGP_Mitra\\SGP_Mitra-main\\app\\data\\model.h5'
try:
    model.load_weights(model_path)
    print("Weights loaded successfully!")
except Exception as e:
    print(f"Error loading weights: {e}")

# Load pre-trained emotion model

# Haar Cascade for face detection
CASCADE_PATH = "C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New SGP\\Mitra_Dhruvil_Branch\\SGP_Mitra\\SGP_Mitra-main\\app\\data\\haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# Emotion labels
emotion_dict = {0: "angry", 1: "disgust", 2: "fear", 3: "happy", 4: "neutral", 5: "sad", 6: "surprise"}

# Load music dataset
df = pd.read_csv("C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New SGP\\Mitra_Dhruvil_Branch\\SGP_Mitra\\SGP_Mitra-main\\app\\data\\spotify_dataset.csv")

df = df.dropna()



@user_routes.route("/get-username", methods=["POST", "GET"])
def get_username():
    try:
        access_token = None

        # Try getting token from JSON body (for POST requests)
        if request.method == "POST":
            data = request.get_json(silent=True)  # Use silent=True to avoid errors if JSON is missing
            access_token = data.get("access_token") if data else None

        # If no token in JSON, check the URL query parameters (for GET requests)
        if not access_token:
            access_token = request.args.get("access_token")

        # If still no token, check if it's stored in cookies (optional)
        if not access_token:
            access_token = request.cookies.get("access_token")

        if not access_token:
            return jsonify({"msg": "Unauthorized: No token provided"}), 401

        decoded_token = decode_token(access_token)  # Decode the JWT token
        email = decoded_token.get("sub")  # Extract email from token

        if not email:
            return jsonify({"msg": "Invalid or expired token"}), 401

        # Fetch user from database using the extracted email
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"msg": "User not found"}), 404

        return jsonify({"username": user.get("username")}), 200

    except Exception as e:
        return jsonify({"msg": "Error retrieving username", "error": str(e)}), 500

    

@user_routes.route("/profile", methods=["POST"])
def get_profile():
    try:
        data = request.get_json()
        if not data or "access_token" not in data:
            return jsonify({"msg": "Unauthorized: No token provided"}), 401

        access_token = data["access_token"]
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")

        if not email:
            return jsonify({"msg": "Invalid or expired token"}), 401
        
        # Fetch user from database using the extracted email
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"msg": "User not found"}), 404
        
        user_data = {
            "_id": str(user["_id"]),
            "user_id": user["user_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "username": user["username"],
            "test_results": user["test_results"],
            "chatbot_preference": user["chatbot_preference"],
            "country": user.get("country", ""),  # Use .get() with a default value
            "gender": user.get("gender", ""),
            "phone_number": user.get("phone_number", "")
        }

        return jsonify(user_data), 200
    
    except Exception as e:
        return jsonify({"msg": "Error retrieving profile", "error":str(e)}), 500
    
@user_routes.route("/update_profile", methods=["POST"])
def update_profile():
    try:
        data = request.get_json()
        if not data or "access_token" not in data:
            return jsonify({"msg": "Unauthorized: No token provided"}), 401

        access_token = data["access_token"]
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")

        if not email:
            return jsonify({"msg": "Invalid or expired token"}), 401

         # Extract profile update fields
        update_fields = {
            "full_name": data.get("full_name"),
            "username": data.get("username"),
            "gender": data.get("gender"),
            "country": data.get("country"),
            "phone_number": data.get("phone_number")
        }

        # Remove None values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}

        # Update user in database
        result = users_collection.update_one(
            {"email": email},
            {"$set": update_fields}
        )

        if result.modified_count > 0:
            # Fetch updated user data
            updated_user = users_collection.find_one({"email": email})
            
            # Prepare user data response
            user_data = {
                "full_name": updated_user.get("full_name"),
                "username": updated_user.get("username"),
                "email": updated_user.get("email"),
                "gender": updated_user.get("gender"),
                "country": updated_user.get("country"),
                "phone_number": updated_user.get("phone_number")
            }

            return jsonify({
                "msg": "Profile updated successfully", 
                "user_data": user_data
            }), 200
        else:
            return jsonify({"msg": "No changes were made"}), 200

    except Exception as e:
        return jsonify({"msg": "Error updating profile", "error": str(e)}), 500



def detect_emotions():


    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return {"error": "Could not open webcam."}

    detected_emotions = []
    count = 0

    while count < 15:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30))

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y + h, x:x + w]
            roi_gray_resized = cv2.resize(roi_gray, (48, 48))
            cropped_img = np.expand_dims(np.expand_dims(roi_gray_resized, -1), 0)

            # Predict emotion
            prediction = model.predict(cropped_img)
            max_index = int(np.argmax(prediction))
            detected_emotions.append(emotion_dict[max_index])

        count += 1

        # Stop capturing when 's' is pressed
        if cv2.waitKey(1) & 0xFF == ord('s'):
            break

    cap.release()
    cv2.destroyAllWindows()

    return list(set(detected_emotions))

def recommend_music(emotions):
    """Filters music dataset based on detected emotions."""
    recommended_songs = df[df["seeds"].apply(lambda x: any(e in x for e in emotions))]
    recommended_songs["spotify_id"] = recommended_songs["lastfm_url"].apply(lambda x: x.split("/")[-1])
    return recommended_songs[["track", "artist", "spotify_id", "genre"]].to_dict(orient="records")

@user_routes.route("/detect_emotion", methods=["GET"])
def handle_emotion_detection():
    emotions = detect_emotions()
    if "error" in emotions:
        return jsonify({"error": emotions["error"]})
    
    print(f'Emotions detected {emotions}')

    recommendations = recommend_music(emotions)

    
    # recommendations = recommendations.replace({np.nan: None})
    print("after")
    

    response = jsonify({"detected_emotions": emotions, "recommendations": recommendations})
    response.headers["Content-Type"] = "application/json"
    return response


@user_routes.route("generate_music", methods=["POST"])
def generate_music():
    data = request.get_json()
    prompt = data.get("prompt", "")

    print(f'Prompt: {prompt}')


    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    try:
        # Process text input
        # prompt = generate_prompt_for_music_generation(prompt)

        print(f"New prompt: {prompt}" )
        inputs = processor(text=[prompt], return_tensors="pt").to(device)

        # Generate AI music
        print("Generating")
        music_waveform = model_musicgen.generate(**inputs, max_new_tokens=500)
        print("Before")

        print(music_waveform.shape)

        # print("Converting to 2D")
        # Convert waveform to 2D (mono)
        music_waveform = music_waveform.squeeze(0).cpu()

        print("After")

        print(music_waveform.shape)


        # Define output file path
        print("Getting folder output")
        output_path = os.path.join(OUTPUT_DIR, "generated_music.wav")

        print(f'Output Path {output_path}')

        # Save generated music
        print("Saving")
        torchaudio.save('C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New SGP\\Mitra_Dhruvil_Branch\\SGP_Mitra\\SGP_Mitra-main\\app\\static\\generated_music\\generated_music.wav', music_waveform, 24000)
        title = generate_music_title(prompt)
        print(f'New title of music {title}')
        torchaudio.save(f'C:\\Users\\Smit\\Desktop\\DESKTOP\\6th sem\\New SGP\\Mitra_Dhruvil_Branch\\SGP_Mitra\\SGP_Mitra-main\\app\\music_samples\\{title}.wav', music_waveform, 24000)
        print("here")
        # Return audio URL


        return jsonify({"audio_url": f"http://127.0.0.1:5000/static/generated_music/generated_music.wav"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
