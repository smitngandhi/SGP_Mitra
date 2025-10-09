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
from langchain_huggingface import HuggingFacePipeline
from langchain_groq import ChatGroq
import torch
from transformers import AutoProcessor , MusicgenForConditionalGeneration
from langchain_google_genai import ChatGoogleGenerativeAI

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
chat_sessions_collection = db["chat_sessions"]
logger.info("[INFO] Chat sessions collection initialized: chat_sessions")
tracking_collection = db[os.getenv("TRACKING_COLLECTION")]
logger.info("[INFO] Tracking collection initialized: tracking")
analytics_collection = db[os.getenv("ANALYTICS_COLLECTION")]
logger.info("[INFO] Analytics collection initialized: analytics")
# Initialize Together.AI-powered LLM
os.environ["GROQ_API_KEY"] = os.getenv('GROQ_API_KEY')
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", 
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.001
)
logger.info("[INFO] LLM initialized with Together.AI model")
groq_llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.0,
    max_retries=2,
    # other params...
)

logger.info("[INFO] Recommendation LLM initialized with Together.AI model")



whisper_model = whisper.load_model("base")
logger.info("[INFO] Whisper model loaded successfully")


elevenlabs = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY")
)

# Load MusicGen model and processor
device = "cuda" if torch.cuda.is_available() else "cpu"
model_musicgen = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small").to(device)
processor = AutoProcessor.from_pretrained("facebook/musicgen-small")




