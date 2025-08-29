from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection , chats_collection
from app.utils.mail import send_reset_email
import secrets
from app.routes import chatbot_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  decode_token, generate_llm_response_sentiment , transcribe_audio_from_mic
import uuid
from fpdf import FPDF
from io import BytesIO
from flask_mail import Mail, Message
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from flask import request, jsonify
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.utils.logger_utils import get_logger
from app.models import elevenlabs
from elevenlabs import play
import base64
import os
from google import genai
from dotenv import load_dotenv
from langdetect import detect

load_dotenv()

logger = get_logger(__name__)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))



@chatbot_routes.route("/api/chat", methods=["POST"])
def chat():

    logger.debug("Received chat request")
    data = request.get_json()
    message = data["message"]
    logger.debug(f"User message: {message}")

    if "access_token" in data and data["access_token"]:
        logger.debug("Access token found, processing authenticated user")
        access_token = data["access_token"]
        logger.debug(f"Access token: {access_token}")
        decoded_token = decode_token(access_token)
        logger.debug(f"Decoded token: {decoded_token}")
        email = decoded_token.get("sub")
        user = users_collection.find_one({"email": email})
        logger.debug(f"User found: {user}")

        chatbot_preference = user["chatbot_preference"]
        logger.debug(f"Chatbot preference: {chatbot_preference}")
        username = user["username"]
        logger.debug(f"Username: {username}")
        logger.debug(f"Getting response from LLM for message. Calling generate_llm_response_sentiment")
        response_text  , sentiment_score = generate_llm_response_sentiment(message , chatbot_preference , username)
        logger.debug(f"Response text: {response_text}")
        chat_entry = {
        "user_id": user["user_id"],
        "email": user["email"],
        "user_message": message,
        "bot_response": response_text,
        "timestamp": datetime.now(timezone.utc),
        "sentiment_score" : sentiment_score
        }
        chats_collection.insert_one(chat_entry)
        logger.debug("Chat entry inserted into database")
        return jsonify({"reply": response_text , "sentiment_score": sentiment_score} )


    logger.debug("No access token found, processing unauthenticated user")
    response_text, sentiment_score = generate_llm_response_sentiment(message , None , None)
    logger.debug(f"Response text for unauthenticated user: {response_text}")



    user_id = str(uuid.uuid4())
    chat_entry = {
        "user_id": user_id,
        "user_message": message,
        "bot_response": response_text,
        "timestamp": datetime.now(timezone.utc),
        "email": "unauthenticated",
        "sentiment_score" : sentiment_score
    }

    chats_collection.insert_one(chat_entry)
    logger.debug("Chat entry for unauthenticated user inserted into database")
    return jsonify({"reply": response_text , "sentiment_score": sentiment_score} )




@chatbot_routes.route("/api/generate_selfcare_pdf", methods=["POST"])
def generate_selfcare_pdf():
    data = request.get_json()
    user_id = data.get("user_id")
    mail = Mail()

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    user = users_collection.find_one({"user_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    email = user["email"]
    username = user["username"]

    chats = list(chats_collection.find({"user_id": user_id}))
    if not chats:
        return jsonify({"error": "No chat history found"}), 404

    analyzer = SentimentIntensityAnalyzer()
    print("here pdf")
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt=f"Self-Care Plan for {username}", ln=True, align='C')
    print("here 1")
    pdf.ln(10)

    avg_sentiment = 0
    num_chats = len(chats)

    for chat in chats:
        print("here 2")
        timestamp = chat["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
        user_message = chat["user_message"]
        scores = analyzer.polarity_scores(user_message)
        sentiment_score = (scores["compound"] + 1) / 2
        avg_sentiment += sentiment_score

        pdf.multi_cell(0 , 10 , f"[{timestamp}] {username}: {user_message}")
        pdf.multi_cell(0, 10, f"[{timestamp}] Bot: {chat['bot_response']}")
        pdf.multi_cell(0, 10, f"Sentiment Score: {sentiment_score:.2f}", border="B")
        pdf.ln(5)

    avg_sentiment /= num_chats

    print("here 3")
    pdf.add_page()
    pdf.cell(200, 10, txt="Personalized Self-Care Plan", ln=True, align='C')
    pdf.ln(10)

    if avg_sentiment < 0.4:
        print("here 4")
        pdf.multi_cell(0, 10, "Your mood has been quite low recently. A structured self-care routine can help improve your emotional well-being. Follow these personalized steps to feel better:")

        steps = [
            "Wake-up Routine (7:30 AM): Start your day with exposure to natural sunlight for at least 10 minutes. Sunlight helps regulate your circadian rhythm and boosts serotonin levels, which improve mood.",
            "Mindful Breathing (4-7-8 method, twice daily): Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. This technique helps activate the parasympathetic nervous system, reducing stress and anxiety.",
            "Journaling Prompt: 'Write about a moment when you felt truly happy and what made it special.' Writing about positive experiences can help rewire your brain to focus on the good.",
            "Nutrition Tip: Begin your day with a protein-rich breakfast (e.g., eggs, yogurt, nuts) to stabilize blood sugar and energy levels.",
            "Evening Relaxation: Listen to calming music or nature sounds before bed to promote relaxation and improve sleep quality.",
            "Social Connection: Reach out to one person today, even if it's just a short message. Social interaction releases oxytocin, which helps reduce stress."
        ]
        for i, step in enumerate(steps, 1):
            pdf.multi_cell(0, 10, f"{i}. {step}")

    elif avg_sentiment < 0.7:
        print("here 5")
        pdf.multi_cell(0, 10, "Your mood appears balanced, and maintaining a structured self-care routine will help sustain your well-being. Here's a set of habits to reinforce emotional stability and boost happiness:")

        steps = [
            "Morning Gratitude Exercise: Upon waking, list three things you're grateful for. Practicing gratitude increases dopamine and serotonin levels, improving emotional resilience.",
            "Light Exercise (15 minutes of yoga/stretching): Engaging in physical movement helps release endorphins and reduces stress hormones like cortisol.",
            "Mindful Breaks: Take short breaks throughout your day. Have a warm cup of tea or coffee without distractions. Being present in small moments reduces mental fatigue.",
            "Bedtime Wind-Down: Read for 10 minutes before sleep instead of using screens. This promotes melatonin production and enhances sleep quality.",
            "Creative Expression: Engage in a hobby such as painting, music, or crafting. Creativity provides a sense of accomplishment and joy."
        ]
        for i, step in enumerate(steps, 1):
            pdf.multi_cell(0, 10, f"{i}. {step}")

    else:
        print("here 8")
        pdf.multi_cell(0, 10, "You are experiencing a period of positive emotions and high energy. Maintain this momentum with habits that reinforce positivity and personal growth:")

        steps = [
            "Daily Physical Activity (20 minutes minimum): Exercise is proven to enhance cognitive function, improve mood, and increase energy levels.",
            "Social Engagement: Plan an outing with friends or family. Social interactions strengthen emotional bonds and reduce stress.",
            "Personal Growth Challenge: Set a new goal for yourself—whether it's learning a skill, taking an online course, or working towards a passion project.",
            "Sleep Hygiene: Maintain a regular sleep schedule and aim for 7-8 hours of quality sleep to support cognitive function and emotional balance."
        ]
        for i, step in enumerate(steps, 1):
            pdf.multi_cell(0, 10, f"{i}. {step}")

    print("here 9")
    pdf.ln(10)
    pdf.cell(200, 10, "Stay positive, be kind to yourself, and take care!", ln=True, align='C')

    pdf_output = BytesIO()
    print("here 10")
    pdf_output.write(pdf.output(dest="S").encode("latin-1"))
    pdf_output.seek(0)

    msg = Message("Your Personalized Self-Care Plan", sender="mitrahelpline123@gmail.com", recipients=[email])
    msg.body = "Attached is your self-care plan based on your chat history and sentiment analysis."
    msg.attach("self_care_plan.pdf", "application/pdf", pdf_output.getvalue())
    mail.send(msg)

    return jsonify({"message": "Self-care plan sent successfully to email."})


@chatbot_routes.route("/voice_chat", methods=["POST"])
def voice_chat():
    logger.debug("Received /voice_chat request")
    try:
        # Check if audio file exists in request
        if "audio" not in request.files:
            logger.warning("No audio file found in request")
            return jsonify({"error": "Audio file is required"}), 400

        audio_file = request.files["audio"]
        logger.debug(f"Audio file received: {audio_file.filename}")

        
    

        # Access token (optional)
        access_token = request.form.get("access_token")
        if not access_token or access_token.lower() == "null":
            access_token = None
        logger.debug(f"Access token received: {bool(access_token)}")

        # Read file into BytesIO for transcription
        # audio_data = BytesIO(audio_file.read())
        logger.debug("Audio data loaded into memory for transcription")

        # Transcription
        try:
            # transcription = elevenlabs.speech_to_text.convert(
            #     file=audio_data,
            #     model_id="scribe_v1",
            #     tag_audio_events=True,
            #     diarize=True,
            # )
            # message = transcription.text.strip()
            UPLOAD_DIR = "uploads"  # your custom folder

            # Ensure folder exists
            os.makedirs(UPLOAD_DIR, exist_ok=True)

            # Save file to that folder
            temp_path = os.path.join(UPLOAD_DIR, "uploaded_audio.mp3")
            audio_file.save(temp_path)

            # Upload to Gemini
            myfile = client.files.upload(file=temp_path)

            # logger.debug(f"File uploaded to GenAI: {myfile.id}")

            prompt = """You are an AI transcription assistant.  
                        Your task is to accurately transcribe the provided audio recording into text.  

                        Instructions:
                        - Do not summarize or paraphrase.  
                        - Write out the exact spoken words.  
                        - Preserve natural pauses, filler words, and incomplete sentences.  
                        - Format as plain text transcript.  
                        - If audio is unclear, mark it as [inaudible].
                        - Do not add any additional commentary or interpretation.
                        - Ensure the transcription is clear and easy to read.
                        - Use punctuation to reflect the natural flow of speech."""
            
            response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[prompt, myfile]
                        )
            
            message = response.text
            logger.debug(f"Transcription result: {message}")
        except Exception as e:
            logger.error(f"Error during transcription: {e}", exc_info=True)
            return jsonify({"error": "Failed to transcribe audio"}), 500
        
        finally:
        # ✅ Always clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)


        # If authenticated
        if access_token:
            try:
                decoded_token = decode_token(access_token)
                email = decoded_token.get("sub")
                logger.debug(f"Decoded token. Email: {email}")

                user = users_collection.find_one({"email": email})
                if not user:
                    logger.warning(f"No user found for email: {email}")
                    return jsonify({"error": "User not found"}), 404

                chatbot_preference = user.get("chatbot_preference")
                username = user.get("username", "User")
                logger.debug(f"Chatbot preference: {chatbot_preference}, Username: {username}")

                # Generate response
                response_text, sentiment_score = generate_llm_response_sentiment(
                    message, chatbot_preference, username
                )
                logger.debug(f"Generated bot response: {response_text}")

                # Convert response to speech
                try:
                    audio = elevenlabs.text_to_speech.convert(
                        text=response_text,
                        voice_id="JBFqnCBsd6RMkjVDRZzb",
                        model_id="eleven_multilingual_v2",
                        output_format="mp3_44100_128",
                    )
                    # play(audio)
                    logger.debug("Converting to raw")
                    audio_bytes = b"".join(audio)
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    print("Audio conversion successful")
                except Exception as e:
                    logger.error(f"Error generating TTS: {e}", exc_info=True)

                # Store in DB
                chat_entry = {
                    "user_id": user["user_id"],
                    "email": user["email"],
                    "user_message": message,
                    "bot_response": response_text,
                    "timestamp": datetime.now(timezone.utc),
                    "sentiment_score": sentiment_score
                }
                chats_collection.insert_one(chat_entry)
                logger.debug("Chat entry inserted for authenticated user")

                return jsonify({
                    "reply": response_text,
                    "sentiment_score": sentiment_score,
                    "user_message": message,
                    "audio": audio_base64
                })

            except Exception as e:
                logger.error(f"Error processing authenticated request: {e}", exc_info=True)
                return jsonify({"error": "Authentication or processing failed"}), 500

        # If unauthenticated
        else:
            logger.debug("No access token. Processing as unauthenticated user")
            response_text, sentiment_score = generate_llm_response_sentiment(message, None, None)
            audio = elevenlabs.text_to_speech.convert(
                        text=response_text,
                        voice_id="JBFqnCBsd6RMkjVDRZzb",
                        model_id="eleven_multilingual_v2",
                        output_format="mp3_44100_128",
                    )
            # play(audio)
            audio_bytes = b"".join(audio)
            logger.debug("Converting to raw")
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

            user_id = str(uuid.uuid4())
            chat_entry = {
                "user_id": user_id,
                "email": "unauthenticated",
                "user_message": message,
                "bot_response": response_text,
                "timestamp": datetime.now(timezone.utc),
                "sentiment_score": sentiment_score
            }
            chats_collection.insert_one(chat_entry)
            logger.debug("Chat entry inserted for unauthenticated user")

            return jsonify({
                "reply": response_text,
                "sentiment_score": sentiment_score,
                "user_message": message,
                "audio": audio_base64
            })

    except Exception as e:
        logger.error(f"Unexpected error in /voice_chat: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500