import bcrypt
from flask_jwt_extended import create_access_token, decode_token
import re
import hashlib
import requests
from app.models import *
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.utils import *
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
from langchain.chains import ConversationChain
from langchain.chains.conversation.memory import ConversationBufferMemory
from app.models import llm
import datetime
user_memories = {}




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

    global user_memories
    print(f"[DEBUG] User memories: {user_memories}")
    print(f"[DEBUG] Function called with user_message: '{user_message}', chatbot_preference: '{chatbot_preference}', username: '{username}'")
    
    # Defining Analyzer
    analyzer = SentimentIntensityAnalyzer()
    print(f"[DEBUG] SentimentIntensityAnalyzer initialized")

    # Sentiment Analysis
    scores = analyzer.polarity_scores(user_message)
    print(f"[DEBUG] Sentiment scores calculated: {scores}")
    compound_score = scores['compound']
    print(f"[DEBUG] Compound score: {compound_score}")
    sentiment_score = (compound_score + 1) / 2
    print(f"[DEBUG] Final sentiment score: {sentiment_score}")

    # Check if the message is to generate a plan
    # if "generate" in user_message.lower() and "plan" in user_message.lower():
    #     user = users_collection.find_one({"username": username})
    #     if not user:
    #         return "Sorry you have to register first to generate a self-care plan", 0.5

    #     user_id = user.get("user_id")
    #     if not user_id:
    #         return "Sorry you have to register first to generate a self-care plan", 0.5

    #     response = requests.post(
    #         "http://127.0.0.1:5000/api/v1/api/generate_selfcare_pdf",
    #         json={"user_id": user_id}
    #     )

    #     if response.status_code == 200:
    #         return "Your self-care plan is being generated and will be emailed to you.", sentiment_score
    #     else:
    #         return "Error generating self-care plan.", sentiment_score

    display_name = username if username else "user"
    print(f"[DEBUG] Display name set to: '{display_name}'")
    chatbot_preference = chatbot_preference if chatbot_preference else "Mild_support"
    print(f"[DEBUG] Chatbot preference set to: '{chatbot_preference}'")

    # Agentic architecture with LangChain ConversationChain
    

    # Use username as session id for memory, fallback to stateless if not available
    print(f"[DEBUG] Starting memory initialization for username: '{display_name}'")
   
    print(f"[DEBUG] Username provided, using persistent memory")
        # Use a global or persistent memory dict for user sessions
    
    if display_name not in user_memories:
        user_memories[display_name] = ConversationBufferMemory()
        print(f"[DEBUG] Created new ConversationBufferMemory for username: '{display_name}'")
        memory = user_memories[display_name]
        print(f"[DEBUG] Retrieved existing memory for username: '{display_name}'")
    else:
        print(f"[DEBUG] Username called again")
        memory = user_memories[display_name]
        print(f"[DEBUG] Retrieved existing memory for username: '{display_name}'")

    # Preload Pinecone history if memory is empty
    print(f"[DEBUG] Checking if memory buffer is empty: {not memory.buffer}")
    if username and not memory.buffer:
        print(f"[DEBUG] Loading Pinecone history for username: '{username}'")
        # Fetch all previous conversations for this user from Pinecone
        pinecone_results = dense_index.search(
            namespace="example-namespace",
            query={
                "top_k": 100,  # fetch up to 100 previous messages
                "inputs": {"text": "history"},  # Use a non-empty string
                "filter": {"username": username}
            },
            fields=["chunk_text", "llm_output", "timestamp"]
        )
        print(f"[DEBUG] Pinecone search completed, results: {len(pinecone_results.get('result', {}).get('hits', []))} hits")
        hits = pinecone_results.get('result', {}).get('hits', [])
        # Sort by timestamp (ISO format sorts lexicographically)
        hits = sorted(
            hits,
            key=lambda x: x['fields'].get('timestamp', '')
        ) if hits and 'fields' in hits[0] and 'timestamp' in hits[0]['fields'] else hits
        print(f"[DEBUG] Sorted {len(hits)} hits by timestamp")
        for hit in hits:
            prompt = hit['fields'].get('chunk_text', '')
            response = hit['fields'].get('llm_output', '')
            if prompt and response:
                memory.save_context({"input": prompt}, {"output": response})
        print(f"[DEBUG] Loaded {len(hits)} conversation contexts into memory")
    
    # Compose system prompt
    print(f"[DEBUG] Composing system prompt for {display_name} with {chatbot_preference} preference")
    system_prompt = f"""You are a {chatbot_preference} chatbot named Mitra, providing compassionate support to {display_name}. Your purpose is to create a safe, judgment-free environment where {display_name} can express their thoughts and feelings while receiving personalized guidance tailored to their unique situation.\n\nYour Approach:\n- Deep Empathy: Listen attentively to {display_name}'s concerns, validating their experiences and emotions without judgment\n- Authentic Support: Respond with genuine care and understanding, acknowledging the challenges {display_name} is facing\n- Personalized Guidance: Offer practical suggestions that are relevant to {display_name}'s specific circumstances\n- Structured Communication: Provide clear, organized responses that {display_name} can easily follow and implement\n- Evidence-Based Resources: When appropriate, recommend specific books, techniques, or tools that might benefit {display_name}\n\nIn Your Responses:\n- Begin by acknowledging {display_name}'s feelings and experiences\n- Offer 1-2 practical coping strategies or techniques relevant to their situation\n- When helpful, suggest a specific resource (book, meditation practice, etc.) with a brief explanation of its benefits\n- Close with gentle encouragement and an open-ended question that invites further sharing\n\nRemember that {display_name} is seeking both emotional connection and practical guidance. Balance warm support with actionable advice, always respecting {display_name}'s autonomy and unique perspective. Your goal is to help {display_name} feel heard, supported, and empowered to take positive steps forward.\nWhile providing mental health support, remain mindful of your limitations and encourage professional help when appropriate, while continuing to be a consistent, compassionate presence for {display_name}. Keep your answers as short as possible.\nThe user's chatbot preference is {chatbot_preference}.\nIf it is High-Support, the user is experiencing higher stress levels.\nIf it is Mild-Support, the user is under moderate stress.\nIf it is Minimal-Support, the user is experiencing little to no stress.\nPlease communicate accordingly. Don't include the {chatbot_preference} in responses unless and until it is asked."""
    print(f"[DEBUG] System prompt created, length: {len(system_prompt)} characters")

    # Ensure system prompt is present in memory
    print(f"[DEBUG] Checking if system prompt is already in memory")
    if not any(isinstance(turn, dict) and turn.get('input') == 'system' for turn in getattr(memory, 'buffer', [])):
        memory.save_context({"input": "system"}, {"output": system_prompt})
        print(f"[DEBUG] System prompt saved to memory")
    else:
        print(f"[DEBUG] System prompt already exists in memory")

    print(f"[DEBUG] Creating ConversationChain agent with llm and memory")
    agent = ConversationChain(llm=llm, memory=memory, verbose=True)
    print(f"[DEBUG] Agent created successfully")

    # Get agentic response
    print(f"[DEBUG] Invoking agent with user message: '{user_message}'")
    response = agent.predict(input=user_message)
    print(f"[DEBUG] Agent response received: {response}")

    # Only upsert if user_message is not empty or whitespace
    print(f"[DEBUG] Checking if user_message is not empty: '{user_message.strip()}'")
    if user_message.strip() and username:
        print(f"[DEBUG] User message is not empty, preparing to upsert to Pinecone")
        record = [
            {
                "_id": str(uuid.uuid4()),
                "chunk_text": user_message,
                "llm_output": response,
                "username": display_name,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "text": user_message
            }
        ]
        print(f"[DEBUG] Record prepared for upsert: {record}")
        dense_index.upsert_records("example-namespace", record)
        print(f"[DEBUG] Record upserted to Pinecone successfully")
    else:
        print(f"[DEBUG] User message is empty, skipping Pinecone upsert or username is not provided")

    print(f"[DEBUG] Returning response.content and sentiment_score: '{response}', {sentiment_score}")
    return response, sentiment_score

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

def generate_prompt_for_music_generation(user_prompt):
     
     response = llm.invoke(f"Extend the following prompt for music generation, providing only the new, more detailed version: '{user_prompt}'. Also include only the reframe prompt with more detailed on music and don't include the lyrics")

     return response.content

def generate_music_title(user_prompt):
     
     response = llm.invoke(f'Generate an attractive and attention grabbing small title for the prompt in one word without any quotation or punctuation:- {user_prompt}')

     return response.content




    
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