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
from app.utils.logger_utils import get_logger
from elevenlabs.client import ElevenLabs

logger = get_logger(__name__)
logger.debug("[DEBUG] Starting app initialization process in models.py")

logger.debug("[DEBUG] Loading environment variables from .env file")
load_dotenv()
logger.debug("[DEBUG] Environment variables loaded successfully")


SAMPLE_RATE = 16000
ENERGY_THRESHOLD = 30
CHUNK_DURATION = 0.2
CHUNK_SIZE = int(SAMPLE_RATE * CHUNK_DURATION)
SILENCE_DURATION = 1.5


# Initialize MongoDB connection
client = MongoClient(os.getenv("MONGO_URL"))
db = client[os.getenv("MONGO_DB_NAME")]
logger.info(f"[INFO] Connected to MongoDB database: {os.getenv('MONGO_DB_NAME')}")

# Collections
users_collection = db[os.getenv("USERS_COLLECTION")]
logger.info(f"[INFO] Users collection initialized: {os.getenv('USERS_COLLECTION')}")
chats_collection = db[os.getenv("CHATS_COLLECTION")]
logger.info(f"[INFO] Chats collection initialized: {os.getenv('CHATS_COLLECTION')}")

# Initialize Together.AI-powered LLM

llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)
logger.info("[INFO] LLM initialized with Together.AI model")

recommendation_llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature = 0.001
)
logger.info("[INFO] Recommendation LLM initialized with Together.AI model")



whisper_model = whisper.load_model("base")
logger.info("[INFO] Whisper model loaded successfully")


elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY")
)






