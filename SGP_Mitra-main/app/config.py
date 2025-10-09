import os
from dotenv import load_dotenv
from app.utils.logger_utils import get_logger
# Load .env file
load_dotenv()

logger = get_logger(__name__)
logger.debug("[DEBUG] Logger initialized for config.py")


class Config:
    try:
        SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "sgp_mitra")

        # Backend/Frontend URLs
        BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
        BACKEND_PORT = os.getenv("BACKEND_PORT", "5000")
        BACKEND_URL = os.getenv("BACKEND_URL", f"http://{BACKEND_HOST}:{BACKEND_PORT}")
        FRONTEND_HOST = os.getenv("FRONTEND_HOST", "localhost")
        FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000")
        FRONTEND_URL = os.getenv("FRONTEND_URL", f"http://{FRONTEND_HOST}:{FRONTEND_PORT}")

        # Email Configuration
        MAIL_SERVER = os.getenv("MAIL_SERVER")
        MAIL_PORT = os.getenv("MAIL_PORT")
        MAIL_USE_TLS = os.getenv("MAIL_USE_TLS") == "True"
        MAIL_USERNAME = os.getenv("MAIL_USERNAME")
        MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

        # Google OAuth
        CLIENT_ID = os.getenv("CLIENT_ID")
        CLIENT_SECRET = os.getenv("CLIENT_SECRET")

        # API Keys
        TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

        # Directory Paths
        LOGS_DIRECTORY = os.getenv("LOGS_DIRECTORY", "logs")
        UPLOADS_DIRECTORY = os.getenv("UPLOADS_DIRECTORY", "uploads")
        MUSIC_SAMPLES_DIRECTORY = os.getenv("MUSIC_SAMPLES_DIRECTORY", "app/music_samples")

        logger.info("[INFO] Configuration variables loaded into Config class")

    except Exception as e:
        logger.error(f"[ERROR] Failed to load configuration: {str(e)}", exc_info=True)
        raise
# Assign Config
config = Config()
logger.debug("[DEBUG] Config instance created successfully")