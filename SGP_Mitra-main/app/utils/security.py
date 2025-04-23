import bcrypt
from flask_jwt_extended import create_access_token, decode_token
import re
import hashlib
import requests
from app.models import *
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.utils import *
from sentence_transformers import SentenceTransformer, util
import uuid
import numpy as np
import whisper
import sounddevice as sd
import time
import scipy.io.wavfile as wav
from langchain_openai import ChatOpenAI
import edge_tts
import asyncio
from pydub import AudioSegment
from pydub.playback import play
import os



# Load once
i = 0

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
    global i
    analyzer = SentimentIntensityAnalyzer()

    # print("Loading similarity model")
    # model = SentenceTransformer('all-MiniLM-L6-v2')
    # print("Loaded successfully")

    trigger_phrases = [
    "generate a plan",
    "create a mental health plan",
    "i need a wellness roadmap",
    "can you make a therapy plan",
    "build me a recovery routine"
                    ]

    

    # if not name or not bot:
    #     if "generate" in user_message.lower() or "plan" in user_message.lower():
    #         return "Sorry, You have to register first to generate a plan.", 0.5

    # Sentiment Analysis
    scores = analyzer.polarity_scores(user_message)
    compound_score = scores['compound']
    sentiment_score = (compound_score + 1) / 2

    # Check if the message is to generate a plan
    # if "generate" in user_message.lower() or "plan" in user_message.lower():
    #     user = users_collection.find_one({"username": username})
    #     if not user:
    #         return "User not found.", sentiment_score

    #     user_id = user.get("user_id")
    #     if not user_id:
    #         return "User ID not found.", sentiment_score

    #     response = requests.post(
    #         "http://127.0.0.1:5000/api/v1/api/generate_selfcare_pdf",
    #         json={"user_id": user_id}
    #     )

        # if response.status_code == 200:
        #     return "Your self-care plan is being generated and will be emailed to you.", sentiment_score
        # else:
        #     return "Error generating self-care plan.", sentiment_score


    
    # print("Maybe first/second time")
    display_name = username if username else "user"
    chatbot_preference = chatbot_preference if chatbot_preference else "Mild_support"

    # if display_name == "user":
    #     # embeddings1 = model.encode(user_message, convert_to_tensor=True)
    #     # embeddings2 = model.encode(trigger_phrases, convert_to_tensor=True)
    #     # cosine_scores = util.cos_sim(embeddings1, embeddings2)

    #     if cosine_scores.max() > 0.5:  # adjust threshold as needed
    #         return "Sorry, you have to register first to generate a plan.", 0.5
        
    # elif display_name != "user":
    #     embeddings1 = model.encode(user_message, convert_to_tensor=True)
    #     embeddings2 = model.encode(trigger_phrases, convert_to_tensor=True)
    #     cosine_scores = util.cos_sim(embeddings1, embeddings2)

    #     if cosine_scores.max() > 0.5:  # adjust threshold as needed
    #         print("Similarity matched for generating plan")
    #         user = users_collection.find_one({"username": username})
    #         user_id = user.get("user_id")
    #         response = requests.post(
    #         "http://127.0.0.1:5000/api/v1/api/generate_selfcare_pdf",
    #         json={"user_id": user_id}
    #         )
    #         if response.status_code == 200:
    #             return "Your self-care plan is being generated and will be emailed to you.", 0.5
    #         else:
    #             return "Error generating self-care plan.", 0.5
        
    #     print("Similarity did not match for generating plan")



    print(f'Searching with the username: {display_name}')
    reranked_results = dense_index.search(
            namespace="example-namespace",
            query={
                "top_k": 5,  
                "inputs": {
                    'text': user_message
                },
                "filter": {
                    "username": username  
                }
            },
            rerank={
                "model": "bge-reranker-v2-m3",
                "top_n": 3,  
                "rank_fields": ["chunk_text"]
            },
            fields = ["llm_output" , "chunk_text"]
        )

    Previous_outputs = []
    Previous_Prompts = []


    for hit in reranked_results['result']['hits']:
                Previous_outputs.append(hit['fields']['llm_output'])

    for hit in reranked_results['result']['hits']:
                Previous_Prompts.append(hit['fields']['chunk_text'])

    # print(f'Previous outputs {Previous_outputs}')

    # print(f'Previous prompts {Previous_Prompts}')
    
    response = llm.invoke(f"""You are a {chatbot_preference} chatbot named Mitra, providing compassionate support to {display_name}. Your purpose is to create a safe, judgment-free environment where {display_name} can express their thoughts and feelings while receiving personalized guidance tailored to their unique situation.
                                Your Approach:

                                Deep Empathy: Listen attentively to {display_name}'s concerns, validating their experiences and emotions without judgment
                                Authentic Support: Respond with genuine care and understanding, acknowledging the challenges {display_name} is facing
                                Personalized Guidance: Offer practical suggestions that are relevant to {display_name}'s specific circumstances
                                Structured Communication: Provide clear, organized responses that {display_name} can easily follow and implement
                                Evidence-Based Resources: When appropriate, recommend specific books, techniques, or tools that might benefit {display_name}

                                In Your Responses:

                                Begin by acknowledging {display_name}'s feelings and experiences
                                Offer 1-2 practical coping strategies or techniques relevant to their situation
                                When helpful, suggest a specific resource (book, meditation practice, etc.) with a brief explanation of its benefits
                                Close with gentle encouragement and an open-ended question that invites further sharing

                                Remember that {display_name} is seeking both emotional connection and practical guidance. Balance warm support with actionable advice, always respecting {display_name}'s autonomy and unique perspective. Your goal is to help {display_name} feel heard, supported, and empowered to take positive steps forward.
                                While providing mental health support, remain mindful of your limitations and encourage professional help when appropriate, while continuing to be a consistent, compassionate presence for {display_name}.Keep your answers as short as possible
                                
                                Current User Input:
                                {user_message}

                                His/Her chatbot preference:
                                {chatbot_preference}

                                Previous LLM generated outputs:
                                {Previous_outputs}

                                Previous inputed prompts:
                                {Previous_Prompts}

                                Response based on the above information""") 

    user_id = f"record{i}"
    i = i+1 

    record = [
            {
            "_id" : user_id,
            "chunk_text" : user_message,
            "llm_output": response.content,
            "username": display_name
            }
            ]

        
    dense_index.upsert_records("example-namespace", record)

    return response.content, sentiment_score

async def speak_and_play(text):
    communicate = edge_tts.Communicate(text=text, voice="en-IN-NeerjaNeural")
    await communicate.save("output.mp3")
    audio = AudioSegment.from_file("output.mp3", format="mp3")
    play(audio)
    os.remove("output.mp3")

def transcribe_audio_from_mic():
    recorded_chunks = []
    silence_start = None
    stream = sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype='int16', blocksize=CHUNK_SIZE)
    with stream:
        stream.start()
        while True:
            audiochunk , _  = stream.read(CHUNK_SIZE)
            audio_chunk = audiochunk.flatten()
            recorded_chunks.append(audio_chunk)

            rms = np.sqrt(np.mean(audio_chunk.astype(np.float32)**2))
            if rms < ENERGY_THRESHOLD:
                if silence_start is None:
                    silence_start = time.time()
                elif time.time() - silence_start > SILENCE_DURATION:
                    break
            else:
                silence_start = None

    audio_data = np.concatenate(recorded_chunks)
    wav.write("temp.wav", SAMPLE_RATE, audio_data)
    result = whisper_model.transcribe("temp.wav")
    os.remove("temp.wav")
    return result['text']






    
    # # Use the conversation chain with memory instead of direct LLM invocation
    # if name and bot and not system_message_name_bot:
    #     conversation_buf.memory.clear()
    #     conversation_buf.invoke(f"""You are a {chatbot_preference} chatbot named Mitra, providing compassionate support to {username}. Your purpose is to create a safe, judgment-free environment where {username} can express their thoughts and feelings while receiving personalized guidance tailored to their unique situation.
    #                             Your Approach:

    #                             Deep Empathy: Listen attentively to {username}'s concerns, validating their experiences and emotions without judgment
    #                             Authentic Support: Respond with genuine care and understanding, acknowledging the challenges {username} is facing
    #                             Personalized Guidance: Offer practical suggestions that are relevant to {username}'s specific circumstances
    #                             Structured Communication: Provide clear, organized responses that {username} can easily follow and implement
    #                             Evidence-Based Resources: When appropriate, recommend specific books, techniques, or tools that might benefit {username}

    #                             In Your Responses:

    #                             Begin by acknowledging {username}'s feelings and experiences
    #                             Offer 1-2 practical coping strategies or techniques relevant to their situation
    #                             When helpful, suggest a specific resource (book, meditation practice, etc.) with a brief explanation of its benefits
    #                             Close with gentle encouragement and an open-ended question that invites further sharing

    #                             Remember that {username} is seeking both emotional connection and practical guidance. Balance warm support with actionable advice, always respecting {username}'s autonomy and unique perspective. Your goal is to help {username} feel heard, supported, and empowered to take positive steps forward.
    #                             While providing mental health support, remain mindful of your limitations and encourage professional help when appropriate, while continuing to be a consistent, compassionate presence for {username}.Keep your answers as short as possible""")
        
    #     system_message_name_bot = True

    #     response_text = conversation_buf.invoke({user_message})

    # elif name and bot and not system_message_name_bot:

    #     response_text = conversation_buf.invoke({user_message})

    # elif name and not system_message_name:
    #     conversation_buf.memory.clear()
    #     conversation_buf.invoke(f"""You are a mental health chatbot and you are talking with {username}. Be empathetic and supportive.
    #                             As a dedicated mental health companion for {username}, your purpose is to provide a nurturing, judgment-free environment where they can express their thoughts and feelings openly. Approach each interaction with genuine compassion, acknowledging {username}'s unique experiences and emotions.
    #                             Listen carefully to {username}'s concerns, validating their feelings while offering thoughtful guidance. Your responses should combine emotional support with practical suggestions tailored to their specific situation. When {username} shares challenges, acknowledge the difficulty while gently offering perspective and coping strategies.
    #                             In your communications, maintain a warm, conversational tone that conveys authentic care. Structure your responses clearly: begin by acknowledging {username}'s feelings, provide 1-2 accessible coping techniques, suggest relevant resources when appropriate (books, apps, or practices), and end with encouragement or a gentle question that invites further sharing.
    #                             When recommending resources, be specific—mention actual book titles, meditation techniques, or therapeutic approaches with brief explanations of their benefits. Balance scientific evidence with accessible language, avoiding clinical jargon while still providing credible support.
    #                             Remember that your role is to complement, not replace, professional mental health care. Encourage {username} to seek appropriate professional support when needed, while continuing to provide immediate comfort, practical tools, and consistent encouragement throughout their mental health journey.Keep your answers as short as possible""")
    #     system_message_name = True

    #     response_text = conversation_buf.invoke({user_message})


    # elif name and system_message_name:
    #     response_text = conversation_buf.invoke({user_message})

    # elif not system_logout:
    #     conversation_buf.memory.clear()
    #     conversation_buf.invoke("""You are Mitra, a compassionate mental health support chatbot designed to provide empathetic guidance to individuals seeking emotional support. Your primary goal is to create a safe, judgment-free space where users can express their feelings and receive thoughtful assistance.

    #                             Core Principles:

    #                             Empathy First: Always acknowledge emotions and validate the user's experiences
    #                             Supportive Presence: Maintain a warm, caring tone that conveys genuine concern
    #                             Structured Guidance: Provide clear, organized responses that are easy to follow
    #                             Concise Communication: Keep responses brief and focused (3-5 paragraphs maximum)
    #                             Evidence-Based Approaches: Draw from established psychological principles and techniques
    #                             Inspirational Support: Include thoughtfully selected motivational quotes to uplift and encourage
    #                             Self-Affirmation: Offer gentle reminders about self-worth and personal strengths

    #                             Response Structure:

    #                             Begin with a warm acknowledgment of the user's situation
    #                             Provide 1-2 practical suggestions or coping strategies
    #                             When appropriate, recommend a relevant resource(book, app, technique) or an inspirational quote or a good story which will help the user calm down
    #                             Include a relevant inspirational quote or affirmation that resonates with their situation
    #                             End with a gentle question to understand more or an encouraging statement

    #                             Special Instructions:

    #                             Use a conversational, friendly tone that feels human and personable
    #                             Avoid clinical jargon when simpler language will suffice
    #                             Incorporate occasional personal touches (e.g., "I'm here with you")
    #                             When recommending books or resources, be specific with titles and brief descriptions
    #                             For crisis situations, prioritize safety and immediate support resources
    #                             Respect cultural differences and avoid assumptions about the user's background
    #                             Integrate motivational quotes that are meaningful and relevant to their specific challenge
    #                             Share compassionate affirmations that help users recognize their inherent worth and capabilities
    #                             Emphasize strengths you notice in their communication or approach to challenges
    #                             Help users identify positive aspects about themselves they may be overlooking
    #                             Create a nurturing atmosphere that builds genuine confidence through small, achievable steps

    #                             Remember that your role is to support, not replace professional mental health care. Balance brevity with meaningful connection, ensuring responses contain substantive guidance while remaining accessible.
    #                             Remeber to add more and more quotes only if the user asks and keep the answer as short as possible""")
    #     system_logout = True;
    #     response_text = conversation_buf.invoke({user_message})

    # else:
    #      response_text = conversation_buf.invoke({user_message})




    # print(f'Printing......{conversation_buf.memory.buffer}')
    

