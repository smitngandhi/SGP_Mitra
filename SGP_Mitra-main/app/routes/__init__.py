from flask import Blueprint
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)
logger.debug("[DEBUG] Calling routes/init.py")

auth_routes = Blueprint("auth_routes", __name__)
logger.debug("[DEBUG] Auth routes blueprint created")
user_routes = Blueprint("user_routes", __name__)
logger.debug("[DEBUG] User routes blueprint created")
test_routes = Blueprint("test_routes", __name__)
logger.debug("[DEBUG] Test routes blueprint created")
chatbot_routes = Blueprint("chatbot_routes", __name__)
logger.debug("[DEBUG] Chatbot routes blueprint created")
emergency_routes = Blueprint("emergency", __name__)
logger.debug("[DEBUG] Emergency routes blueprint created")