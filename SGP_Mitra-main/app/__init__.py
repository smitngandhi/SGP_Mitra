from flask import Flask
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from app.config import Config
from authlib.integrations.flask_client import OAuth
import os

# Load environment variables
load_dotenv()

outh = OAuth()
# Initialize extensions (Do not attach to `app` yet)
mail = Mail()
jwt = JWTManager()

# Initialize Flask app
def create_app():
    app = Flask(__name__)

    config = Config()
    app.config.from_object(config)

    
    # Initialize Extensions with app
    outh.init_app(app)
    mail.init_app(app)
    jwt.init_app(app)
    # CORS(app)

# ✅ Enable CORS Properly
    CORS(app, origins="http://localhost:3000", supports_credentials=True)

    
    # Database Connection (Attach to app)
    client = MongoClient(app.config["MONGO_URL"])  # Get from config
    app.db = client[app.config["MONGO_DB_NAME"]]  # Store DB name in config

    # Register Blueprints
    from app.routes.auth_routes import auth_routes
    from app.routes.user_routes import user_routes
    from app.routes.test_routes import test_routes
    from app.routes.chatbot_routes import chatbot_routes

    app.register_blueprint(auth_routes, url_prefix="/api/v1")
    app.register_blueprint(user_routes, url_prefix="/api/v1")
    app.register_blueprint(test_routes, url_prefix="/api/v1")
    app.register_blueprint(chatbot_routes, url_prefix="/api/v1")

    return app
