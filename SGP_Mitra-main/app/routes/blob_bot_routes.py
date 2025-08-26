from app.utils.logger_utils import get_logger
from app.utils.agent_executor_utils import agent
from app.routes import blob_bot_routes
from flask import make_response, redirect, request, jsonify, url_for


logger = get_logger(__name__)
logger.debug("[DEBUG] Calling routes/blob_bot_routes.py")


@blob_bot_routes.route("/blob/chat", methods=["POST"])
def chat_with_blob_bot():
    data = request.get_json()
    user_message = data.get("message", "")
    logger.debug(f"[DEBUG] Received message for blob bot: {user_message}")

    response = agent.invoke({"input": user_message})

    print(response['output'])

    return jsonify({"reply": response['output'] })




