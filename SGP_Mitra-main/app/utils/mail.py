from flask_mail import Mail, Message
from flask import current_app as app
from app.utils.logger_utils import get_logger


mail = Mail()
logger = get_logger(__name__)
logger.debug("[DEBUG] Initializing mail utility")

def send_reset_email(email, token):
    with app.app_context():
        msg = Message("Password Reset Request", sender=app.config["MAIL_USERNAME"], recipients=[email])
        logger.debug(f"[DEBUG] Sending password reset email to {email}")
        msg.body = f"Click the link to reset your password: http://localhost:3000/reset_password/{token}"
        logger.info(f"[INFO] Password reset email prepared for {email}")
        mail.send(msg)
        logger.info(f"[INFO] Password reset email sent to {email}")