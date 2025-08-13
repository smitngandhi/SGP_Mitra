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
from app.utils.logger_utils import get_logger


logger = get_logger(__name__)
logger.debug("[DEBUG] Initializing security utilities")


logger.debug("[DEBUG] Initializing user memories dictionary")
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
    logger.debug(f"DEBUG User memories: {user_memories}")
    logger.debug(f"[DEBUG] Function called with user_message: '{user_message}', chatbot_preference: '{chatbot_preference}', username: '{username}'")
    
    # Defining Analyzer
    analyzer = SentimentIntensityAnalyzer()
    logger.debug(f"[DEBUG] SentimentIntensityAnalyzer initialized")

    # Sentiment Analysis
    scores = analyzer.polarity_scores(user_message)
    logger.debug(f"[DEBUG] Sentiment scores calculated: {scores}")
    compound_score = scores['compound']
    logger.debug(f"[DEBUG] Compound score: {compound_score}")
    sentiment_score = (compound_score + 1) / 2
    logger.debug(f"[DEBUG] Final sentiment score: {sentiment_score}")

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
    logger.debug(f"[DEBUG] Display name set to: '{display_name}'")
    chatbot_preference = chatbot_preference if chatbot_preference else "Mild_support"
    logger.debug(f"[DEBUG] Chatbot preference set to: '{chatbot_preference}'")

    # Agentic architecture with LangChain ConversationChain
    

    # Use username as session id for memory, fallback to stateless if not available
    logger.debug(f"[DEBUG] Starting memory initialization for username: '{display_name}'")
   
    logger.debug(f"[DEBUG] Username provided, using persistent memory")
        # Use a global or persistent memory dict for user sessions
    
    if display_name not in user_memories:
        user_memories[display_name] = ConversationBufferMemory()
        logger.debug(f"[DEBUG] Created new ConversationBufferMemory for username: '{display_name}'")
        memory = user_memories[display_name]
        logger.debug(f"[DEBUG] Retrieved existing memory for username: '{display_name}'")
    else:
        logger.debug(f"[DEBUG] Username called again")
        memory = user_memories[display_name]
        logger.debug(f"[DEBUG] Retrieved existing memory for username: '{display_name}'")

    # Preload Pinecone history if memory is empty
    logger.debug(f"[DEBUG] Checking if memory buffer is empty: {not memory.buffer}")
    if username and not memory.buffer:
        logger.debug(f"[DEBUG] Loading Pinecone history for username: '{username}'")
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
        logger.debug(f"[DEBUG] Pinecone search completed, results: {len(pinecone_results.get('result', {}).get('hits', []))} hits")
        hits = pinecone_results.get('result', {}).get('hits', [])
        # Sort by timestamp (ISO format sorts lexicographically)
        hits = sorted(
            hits,
            key=lambda x: x['fields'].get('timestamp', '')
        ) if hits and 'fields' in hits[0] and 'timestamp' in hits[0]['fields'] else hits
        logger.debug(f"[DEBUG] Sorted {len(hits)} hits by timestamp")
        for hit in hits:
            prompt = hit['fields'].get('chunk_text', '')
            response = hit['fields'].get('llm_output', '')
            if prompt and response:
                memory.save_context({"input": prompt}, {"output": response})
        logger.debug(f"[DEBUG] Loaded {len(hits)} conversation contexts into memory")
    
    # Compose system prompt
    logger.debug(f"[DEBUG] Composing system prompt for {display_name} with {chatbot_preference} preference")
    system_prompt = f"""You are a {chatbot_preference} chatbot named Mitra, providing compassionate support to {display_name}. Your purpose is to create a safe, judgment-free environment where {display_name} can express their thoughts and feelings while receiving personalized guidance tailored to their unique situation.\n\nYour Approach:\n- Deep Empathy: Listen attentively to {display_name}'s concerns, validating their experiences and emotions without judgment\n- Authentic Support: Respond with genuine care and understanding, acknowledging the challenges {display_name} is facing\n- Personalized Guidance: Offer practical suggestions that are relevant to {display_name}'s specific circumstances\n- Structured Communication: Provide clear, organized responses that {display_name} can easily follow and implement\n- Evidence-Based Resources: When appropriate, recommend specific books, techniques, or tools that might benefit {display_name}\n\nIn Your Responses:\n- Begin by acknowledging {display_name}'s feelings and experiences\n- Offer 1-2 practical coping strategies or techniques relevant to their situation\n- When helpful, suggest a specific resource (book, meditation practice, etc.) with a brief explanation of its benefits\n- Close with gentle encouragement and an open-ended question that invites further sharing\n\nRemember that {display_name} is seeking both emotional connection and practical guidance. Balance warm support with actionable advice, always respecting {display_name}'s autonomy and unique perspective. Your goal is to help {display_name} feel heard, supported, and empowered to take positive steps forward.\nWhile providing mental health support, remain mindful of your limitations and encourage professional help when appropriate, while continuing to be a consistent, compassionate presence for {display_name}. Keep your answers as short as possible.\nThe user's chatbot preference is {chatbot_preference}.\nIf it is High-Support, the user is experiencing higher stress levels.\nIf it is Mild-Support, the user is under moderate stress.\nIf it is Minimal-Support, the user is experiencing little to no stress.\nPlease communicate accordingly. Don't include the {chatbot_preference} in responses unless and until it is asked."""
    logger.debug(f"[DEBUG] System prompt created, length: {len(system_prompt)} characters")

    # Ensure system prompt is present in memory
    logger.debug(f"[DEBUG] Checking if system prompt is already in memory")
    if not any(isinstance(turn, dict) and turn.get('input') == 'system' for turn in getattr(memory, 'buffer', [])):
        memory.save_context({"input": "system"}, {"output": system_prompt})
        logger.debug(f"[DEBUG] System prompt saved to memory")
    else:
        logger.debug(f"[DEBUG] System prompt already exists in memory")

    logger.debug(f"[DEBUG] Creating ConversationChain agent with llm and memory")
    agent = ConversationChain(llm=llm, memory=memory, verbose=False)
    logger.debug(f"[DEBUG] Agent created successfully")

    # Get agentic response
    logger.debug(f"[DEBUG] Invoking agent with user message: '{user_message}'")
    response = agent.predict(input=user_message)
    logger.debug(f"[DEBUG] Agent response received: {response}")

    # Only upsert if user_message is not empty or whitespace
    logger.debug(f"[DEBUG] Checking if user_message is not empty: '{user_message.strip()}'")
    if user_message.strip() and username:
        logger.debug(f"[DEBUG] User message is not empty, preparing to upsert to Pinecone")
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
        logger.debug(f"[DEBUG] Record prepared for upsert: {record}")
        dense_index.upsert_records("example-namespace", record)
        logger.debug(f"[DEBUG] Record upserted to Pinecone successfully")
    else:
        logger.debug(f"[DEBUG] User message is empty, skipping Pinecone upsert or username is not provided")

    logger.debug(f"[DEBUG] Returning response.content and sentiment_score: '{response}', {sentiment_score}")
    return response, sentiment_score

async def speak_and_play(text):
    communicate = edge_tts.Communicate(text=text, voice="en-IN-NeerjaNeural")
    await communicate.save("output.mp3")
    audio = AudioSegment.from_file("output.mp3", format="mp3")
    play(audio)
    # os.remove("output.mp3")

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
     logger.debug(f"[DEBUG] Generated prompt for music generation: {response.content}")
     return response.content

def generate_music_title(user_prompt):
     
     response = llm.invoke(f'Generate an attractive and attention grabbing small title for the prompt in one word without any quotation or punctuation:- {user_prompt}')
     logger.debug(f"[DEBUG] Generated music title: {response.content}")
     return response.content
