from flask import Flask
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from app.config import Config
from authlib.integrations.flask_client import OAuth
import os
from app.utils.logger_utils import get_logger
from app.routes.auth_routes import auth_routes
from app.routes.user_routes import user_routes
from app.routes.test_routes import test_routes
from app.routes.chatbot_routes import chatbot_routes
from app.routes.emergency_routes import emergency_routes
from app.routes.blob_bot_routes import blob_bot_routes
from app.routes.tracking_routes import tracking_routes

# Load environment variables



logger = get_logger(__name__)
logger.debug("[DEBUG] Starting app initialization process in __init__.py")

logger.debug("[DEBUG] Loading environment variables from .env file")
load_dotenv()
logger.debug("[DEBUG] Environment variables loaded successfully")


outh = OAuth()
mail = Mail()
jwt = JWTManager()

# Initialize Flask app
def create_app():
    logger.debug("[DEBUG] Starting Flask app creation")
    app = Flask(__name__)


    logger.debug("[DEBUG] Configuring app with Config class")
    config = Config()
    app.config.from_object(config)
    logger.info("[INFO] App configuration loaded successfully")

    try:
        # Initialize Extensions with app
        outh.init_app(app)
        mail.init_app(app)
        jwt.init_app(app)
        logger.info("[INFO] Flask extensions initialized successfully")

        # Enable CORS
        CORS(app, origins="http://localhost:3000", supports_credentials=False)
        logger.info("[INFO] CORS enabled for http://localhost:3000")

        # Database Connection
        client = MongoClient(app.config["MONGO_URL"])
        app.db = client[app.config["MONGO_DB_NAME"]]
        logger.info(f"[INFO] Connected to MongoDB database: {app.config['MONGO_DB_NAME']}")

        # Register Blueprints
        

        app.register_blueprint(auth_routes, url_prefix="/api/v1")
        app.register_blueprint(user_routes, url_prefix="/api/v1")
        app.register_blueprint(test_routes, url_prefix="/api/v1")
        app.register_blueprint(chatbot_routes, url_prefix="/api/v1")
        app.register_blueprint(emergency_routes, url_prefix="/api/v1")
        app.register_blueprint(blob_bot_routes, url_prefix="/api/v1")
        app.register_blueprint(tracking_routes, url_prefix="/api/v1")
        logger.info("[INFO] Blueprints registered successfully")

        # Start background services
        logger.info("[INFO] Background services initialized")

    except Exception as e:
        logger.error(f"[ERROR] Failed during app initialization: {str(e)}", exc_info=True)
        raise

    logger.debug("[DEBUG] Flask app creation completed")
    return app