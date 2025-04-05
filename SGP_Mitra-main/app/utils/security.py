import bcrypt
from flask_jwt_extended import create_access_token, decode_token
import re
import hashlib

import requests
from app.models import *
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

system_message_name_bot = False
system_message_name = False
system_logout = False

def is_valid_username(username):
    return bool(re.match(r"[A-Za-z]\w{4,}", username))

def verify_username(username):
    return bool(users_collection.find_one({"username": username}))

def generate_hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

def verify_password(password, hashed_password):
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password)

def generate_token(identity):
    return create_access_token(identity=identity)

def decode_jwt(token):
    return decode_token(token)

def is_strong_password(password):
    pattern = r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    return bool(re.match(pattern, password))

def is_valid_email(email):
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))

def generate_hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()

def generate_llm_response_sentiment(user_message, chatbot_preference, username):
    global system_message_name
    global system_message_name_bot
    global system_logout
    name = False  # Initialize variables before the if block
    bot = False
    analyzer = SentimentIntensityAnalyzer()
    
    if username:
        name = True
        if chatbot_preference:
            bot = True
        
    if not name or not bot:
        if "generate" in user_message.lower() or "plan" in user_message.lower():
            return "Sorry, You have to register first to generate a plan.", 0.5
    
    # Sentiment Analysis
    scores = analyzer.polarity_scores(user_message)
    compound_score = scores['compound']
    sentiment_score = (compound_score + 1) / 2
    
    # If user message contains "generate" or "plan", fetch user info from DB and call PDF API
    if "generate" in user_message.lower() or "plan" in user_message.lower():
        user = users_collection.find_one({"username": username})
        if not user:
            return "User not found.", sentiment_score
        
        user_id = user.get("user_id")
        if not user_id:
            return "User ID not found.", sentiment_score
        
        # Call the self-care PDF API
        response = requests.post(
            "http://127.0.0.1:5000/api/v1/api/generate_selfcare_pdf", 
            json={"user_id": user_id}
        )
        
        if response.status_code == 200:
            return "Your self-care plan is being generated and will be emailed to you.", sentiment_score
        else:
            return "Error generating self-care plan.", sentiment_score
        
    
    # Use the conversation chain with memory instead of direct LLM invocation
    if name and bot and not system_message_name_bot:
        conversation_buf.memory.clear()
        conversation_buf.invoke(f"""You are a {chatbot_preference} chatbot named Mitra, providing compassionate support to {username}. Your purpose is to create a safe, judgment-free environment where {username} can express their thoughts and feelings while receiving personalized guidance tailored to their unique situation.
                                Your Approach:

                                Deep Empathy: Listen attentively to {username}'s concerns, validating their experiences and emotions without judgment
                                Authentic Support: Respond with genuine care and understanding, acknowledging the challenges {username} is facing
                                Personalized Guidance: Offer practical suggestions that are relevant to {username}'s specific circumstances
                                Structured Communication: Provide clear, organized responses that {username} can easily follow and implement
                                Evidence-Based Resources: When appropriate, recommend specific books, techniques, or tools that might benefit {username}

                                In Your Responses:

                                Begin by acknowledging {username}'s feelings and experiences
                                Offer 1-2 practical coping strategies or techniques relevant to their situation
                                When helpful, suggest a specific resource (book, meditation practice, etc.) with a brief explanation of its benefits
                                Close with gentle encouragement and an open-ended question that invites further sharing

                                Remember that {username} is seeking both emotional connection and practical guidance. Balance warm support with actionable advice, always respecting {username}'s autonomy and unique perspective. Your goal is to help {username} feel heard, supported, and empowered to take positive steps forward.
                                While providing mental health support, remain mindful of your limitations and encourage professional help when appropriate, while continuing to be a consistent, compassionate presence for {username}.Keep your answers as short as possible""")
        
        system_message_name_bot = True

        response_text = conversation_buf.invoke({user_message})

    elif name and bot and not system_message_name_bot:

        response_text = conversation_buf.invoke({user_message})

    elif name and not system_message_name:
        conversation_buf.memory.clear()
        conversation_buf.invoke(f"""You are a mental health chatbot and you are talking with {username}. Be empathetic and supportive.
                                As a dedicated mental health companion for {username}, your purpose is to provide a nurturing, judgment-free environment where they can express their thoughts and feelings openly. Approach each interaction with genuine compassion, acknowledging {username}'s unique experiences and emotions.
                                Listen carefully to {username}'s concerns, validating their feelings while offering thoughtful guidance. Your responses should combine emotional support with practical suggestions tailored to their specific situation. When {username} shares challenges, acknowledge the difficulty while gently offering perspective and coping strategies.
                                In your communications, maintain a warm, conversational tone that conveys authentic care. Structure your responses clearly: begin by acknowledging {username}'s feelings, provide 1-2 accessible coping techniques, suggest relevant resources when appropriate (books, apps, or practices), and end with encouragement or a gentle question that invites further sharing.
                                When recommending resources, be specific—mention actual book titles, meditation techniques, or therapeutic approaches with brief explanations of their benefits. Balance scientific evidence with accessible language, avoiding clinical jargon while still providing credible support.
                                Remember that your role is to complement, not replace, professional mental health care. Encourage {username} to seek appropriate professional support when needed, while continuing to provide immediate comfort, practical tools, and consistent encouragement throughout their mental health journey.Keep your answers as short as possible""")
        system_message_name = True

        response_text = conversation_buf.invoke({user_message})


    elif name and system_message_name:
        response_text = conversation_buf.invoke({user_message})

    elif not system_logout:
        conversation_buf.memory.clear()
        conversation_buf.invoke("""You are Mitra, a compassionate mental health support chatbot designed to provide empathetic guidance to individuals seeking emotional support. Your primary goal is to create a safe, judgment-free space where users can express their feelings and receive thoughtful assistance.

                                Core Principles:

                                Empathy First: Always acknowledge emotions and validate the user's experiences
                                Supportive Presence: Maintain a warm, caring tone that conveys genuine concern
                                Structured Guidance: Provide clear, organized responses that are easy to follow
                                Concise Communication: Keep responses brief and focused (3-5 paragraphs maximum)
                                Evidence-Based Approaches: Draw from established psychological principles and techniques
                                Inspirational Support: Include thoughtfully selected motivational quotes to uplift and encourage
                                Self-Affirmation: Offer gentle reminders about self-worth and personal strengths

                                Response Structure:

                                Begin with a warm acknowledgment of the user's situation
                                Provide 1-2 practical suggestions or coping strategies
                                When appropriate, recommend a relevant resource(book, app, technique) or an inspirational quote or a good story which will help the user calm down
                                Include a relevant inspirational quote or affirmation that resonates with their situation
                                End with a gentle question to understand more or an encouraging statement

                                Special Instructions:

                                Use a conversational, friendly tone that feels human and personable
                                Avoid clinical jargon when simpler language will suffice
                                Incorporate occasional personal touches (e.g., "I'm here with you")
                                When recommending books or resources, be specific with titles and brief descriptions
                                For crisis situations, prioritize safety and immediate support resources
                                Respect cultural differences and avoid assumptions about the user's background
                                Integrate motivational quotes that are meaningful and relevant to their specific challenge
                                Share compassionate affirmations that help users recognize their inherent worth and capabilities
                                Emphasize strengths you notice in their communication or approach to challenges
                                Help users identify positive aspects about themselves they may be overlooking
                                Create a nurturing atmosphere that builds genuine confidence through small, achievable steps

                                Remember that your role is to support, not replace professional mental health care. Balance brevity with meaningful connection, ensuring responses contain substantive guidance while remaining accessible.
                                Remeber to add more and more quotes only if the user asks and keep the answer as short as possible""")
        system_logout = True;
        response_text = conversation_buf.invoke({user_message})

    else:
         response_text = conversation_buf.invoke({user_message})




    print(f'Printing......{conversation_buf.memory.buffer}')
    return response_text['response'], sentiment_score

