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
        MONGO_URL = os.getenv("MONGO_URL")
        MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

        # Email Configuration
        MAIL_SERVER = os.getenv("MAIL_SERVER")
        MAIL_PORT = os.getenv("MAIL_PORT")
        MAIL_USE_TLS = os.getenv("MAIL_USE_TLS") == "True"
        MAIL_USERNAME = os.getenv("MAIL_USERNAME")
        MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

        # Google OAuth
        CLIENT_ID = os.getenv("CLIENT_ID")
        CLIENT_SECRET = os.getenv("CLIENT_SECRET")

        logger.info("[INFO] Configuration variables loaded into Config class")

    except Exception as e:
        logger.error(f"[ERROR] Failed to load configuration: {str(e)}", exc_info=True)
        raise

# Assign Config
config = Config()
logger.debug("[DEBUG] Config instance created successfully")