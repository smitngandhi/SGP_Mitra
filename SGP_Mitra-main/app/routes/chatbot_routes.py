from app import create_app
from flask import make_response, redirect, request, jsonify, url_for
from app.models import users_collection , chats_collection
from app.utils.mail import send_reset_email
import secrets
from app.routes import chatbot_routes
from datetime import datetime , timedelta 
from datetime import datetime, timedelta, timezone
from app.utils.security import  *
from authlib.integrations.flask_client import OAuth
import certifi
import uuid
from fpdf import FPDF
from io import BytesIO
from flask_mail import Mail, Message
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from flask import request, jsonify
from fpdf import FPDF
from flask_mail import Mail, Message
from io import BytesIO
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer



@chatbot_routes.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json()
    message = data["message"]
    print(message)

    if "access_token" in data and data["access_token"]:
        access_token = data["access_token"]
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        user = users_collection.find_one({"email": email})

        chatbot_preference = user["chatbot_preference"]
        username = user["username"]
        print(f'Username : {username}')
        response_text  , sentiment_score = generate_llm_response_sentiment(message , chatbot_preference , username)
        print(response_text)
        chat_entry = {
        "user_id": user["user_id"],
        "user_message": message,
        "bot_response": response_text,
        "timestamp": datetime.now(timezone.utc),
        "sentiment_score" : sentiment_score
        }
        chats_collection.insert_one(chat_entry)

        return jsonify({"reply": response_text , "sentiment_score": sentiment_score} )


    print("here")
    response_text, sentiment_score = generate_llm_response_sentiment(message , None , None)
    # user_id = request.cookies.get("user_id")  # Fetch user_id from cookies

    # if not user_id:
    #     print("Did not find the user_id")
    #     return jsonify({"error": "Unauthorized"}), 401


    user_id = str(uuid.uuid4())
    chat_entry = {
        "user_id": user_id,
        "user_message": message,
        "bot_response": response_text,
        "timestamp": datetime.now(timezone.utc),
        "sentiment_score" : sentiment_score
    }

    chats_collection.insert_one(chat_entry)

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
    data = request.get_json()
    
    if data.get("from_mic"):
        # Transcribe directly
        message = transcribe_audio_from_mic()
        print(f"[Voice Input] Transcribed: {message}")
        response = llm.invoke(f"convert this text to english: {message} and only give the translated one")
        message = response.content
        print(f'New Message is {message}')
    else:
        message = data["message"]
        print(message)

    if "access_token" in data and data["access_token"]:
        access_token = data["access_token"]
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        user = users_collection.find_one({"email": email})

        chatbot_preference = user["chatbot_preference"]
        username = user["username"]
        print(f'Username : {username}')
        response_text, sentiment_score = generate_llm_response_sentiment(message, chatbot_preference, username)

        # Play the audio response
        asyncio.run(speak_and_play(response_text))

        chat_entry = {
            "user_id": user["user_id"],
            "user_message": message,
            "bot_response": response_text,
            "timestamp": datetime.now(timezone.utc),
            "sentiment_score": sentiment_score
        }
        chats_collection.insert_one(chat_entry)

        return jsonify({"reply": response_text, "sentiment_score": sentiment_score , "user_message": message})

    print("Unauthenticated user")
    response_text, sentiment_score = generate_llm_response_sentiment(message, None, None)
    asyncio.run(speak_and_play(response_text))

    user_id = str(uuid.uuid4())
    chat_entry = {
        "user_id": user_id,
        "user_message": message,
        "bot_response": response_text,
        "timestamp": datetime.now(timezone.utc),
        "sentiment_score": sentiment_score
    }

    chats_collection.insert_one(chat_entry)

    return jsonify({"reply": response_text, "sentiment_score": sentiment_score , "user_message": message})
