from app import create_app
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)
logger.debug("[DEBUG] Starting the application in run.py")

app = create_app()


if __name__ == "__main__":
        app.run(debug=True, host="0.0.0.0" , use_reloader=True)