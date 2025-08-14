from pymongo import MongoClient
import os
from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage
from app.config import Config
from langchain.chains.conversation.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain
import whisper
from dotenv import load_dotenv

load_dotenv()


SAMPLE_RATE = 16000
ENERGY_THRESHOLD = 30
CHUNK_DURATION = 0.2
CHUNK_SIZE = int(SAMPLE_RATE * CHUNK_DURATION)
SILENCE_DURATION = 1.5


# Initialize MongoDB connection
client = MongoClient(os.getenv("MONGO_URL"))
db = client["Mydatabase"]


# Collections
users_collection = db["users"]
tracking_collection = db["tracking"]
chats_collection = db["chats"]

# Initialize Together.AI-powered LLM

llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)

recommendation_llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)


# conversation_buf = ConversationChain(
#     llm = llm,
#     memory = ConversationBufferMemory()
# )

whisper_model = whisper.load_model("base")









