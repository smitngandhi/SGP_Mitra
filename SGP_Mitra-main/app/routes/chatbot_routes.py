from flask import make_response, redirect, request, jsonify, url_for
from collections import defaultdict
from datetime import datetime
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.utils.logger_utils import get_logger
from app.models import elevenlabs
from elevenlabs import play
import base64
import os
from google import genai
from dotenv import load_dotenv
from langdetect import detect
from app.models import users_collection, chats_collection, chat_sessions_collection, llm
from app.utils.security import decode_token, generate_llm_response_sentiment
from app.utils.logger_utils import get_logger
from datetime import datetime, timezone, timedelta
import uuid
from collections import defaultdict
from app.routes import chatbot_routes
from flask_mail import Mail, Message
from fpdf import FPDF
from io import BytesIO
from app.utils import generate_llm_response_with_session
from app.utils.tools_utils import chatbot_tools
from app.utils import initialize_pinecone
from app.utils.generate_llm_response_with_session import generate_llm_response_with_session



load_dotenv()

logger = get_logger(__name__)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))



def generate_chat_title(messages):
    """Generate a concise title for a chat session using LLM"""
    try:
        if not messages or len(messages) == 0:
            return "New Chat"
        
        # Get first few messages for context
        context_messages = messages[:3]
        message_text = ""
        for msg in context_messages:
            role = "User" if msg.get('role') == 'user' else "Assistant"
            content = msg.get('content', '')[:100]  # Limit length
            message_text += f"{role}: {content}\n"
        
        prompt = f"""Generate a concise 3-5 word title for this conversation. The title should capture the main topic or theme.

Conversation:
{message_text}

Examples of good titles:
- "Stress Management Help"
- "Sleep Quality Discussion" 
- "Anxiety Coping Strategies"
- "Mood Improvement Tips"
- "Work-Life Balance Chat"

Return only the title, nothing else:"""

        response = llm.invoke(prompt)
        title = response.content.strip().replace('"', '').replace("'", "")
        
        # Fallback if title is too long or empty
        if len(title) > 50 or len(title) < 3:
            return "Mental Health Chat"
            
        return title
        
    except Exception as e:
        logger.error(f"Error generating chat title: {e}")
        return "Mental Health Chat"

def group_sessions_by_date(sessions):
    """Group chat sessions by date categories like ChatGPT"""
    now = datetime.now(timezone.utc)
    today = now.date()
    yesterday = (now - timedelta(days=1)).date()
    week_ago = (now - timedelta(days=7)).date()
    month_ago = (now - timedelta(days=30)).date()
    
    grouped = {
        "Today": [],
        "Yesterday": [],
        "Previous 7 Days": [],
        "Previous 30 Days": [],
        "Older": []
    }
    
    for session in sessions:
        session_date = session['created_at'].date() if isinstance(session['created_at'], datetime) else datetime.fromisoformat(session['created_at'].replace('Z', '+00:00')).date()
        
        if session_date == today:
            grouped["Today"].append(session)
        elif session_date == yesterday:
            grouped["Yesterday"].append(session)
        elif session_date >= week_ago:
            grouped["Previous 7 Days"].append(session)
        elif session_date >= month_ago:
            grouped["Previous 30 Days"].append(session)
        else:
            grouped["Older"].append(session)
    
    # Remove empty categories
    return {k: v for k, v in grouped.items() if v}

@chatbot_routes.route("/chat/session", methods=["POST"])
def chat_with_session():
    """
    Updated chat endpoint with session-aware memory and Pinecone integration
    
    Flow:
    1. Authenticate user and get/create session
    2. Call generate_llm_response_with_session which:
       - Loads previous session into memory (if new session)
       - Retrieves top 3 similar messages from Pinecone
       - Uses initialize_agent with tools and context
       - Stores message in Pinecone and MongoDB
    3. Return response with session info
    """
    logger.debug("[ROUTE] Received chat request with session management")
    data = request.get_json()
    message = data.get("message")
    session_id = data.get("session_id")  # Optional - will create new session if not provided
    logger.debug(f"[ROUTE] User message: {message}, Session ID: {session_id}")

    if not message or not message.strip():
        logger.warning("[ROUTE] Empty message received")
        return jsonify({"error": "Message cannot be empty"}), 400

    # Check for authentication
    if "access_token" in data and data["access_token"]:
        logger.debug("[ROUTE] Access token found, processing authenticated user")
        access_token = data["access_token"]
        
        try:
            decoded_token = decode_token(access_token)
            email = decoded_token.get("sub")
            user = users_collection.find_one({"email": email})
            logger.debug(f"[ROUTE] User found with email: {email}")

            if not user:
                logger.warning(f"[ROUTE] User not found for email: {email}")
                return jsonify({"error": "User not found"}), 404

            username = user["username"]
            user_id = user["user_id"]
            
            # ===== Get or create session =====
            if session_id:
                # Use provided session
                session = chat_sessions_collection.find_one({
                    "session_id": session_id,
                    "user_id": user_id
                })
                if not session:
                    logger.warning(f"[ROUTE] Session {session_id} not found for user {email}")
                    return jsonify({"error": "Session not found"}), 404
                logger.debug(f"[ROUTE] Using existing session: {session_id}")
            else:
                # Create new session (allows multiple sessions per day)
                now = datetime.now(timezone.utc)
                today = now.strftime("%Y-%m-%d")
                
                # Count user's sessions for session number
                user_sessions_count = chat_sessions_collection.count_documents({"user_id": user_id})
                session_no = user_sessions_count + 1
                
                session = {
                    "session_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "email": email,
                    "title": "New Chat",
                    "created_at": now,
                    "updated_at": now,
                    "date_group": today,
                    "message_count": 0,
                    "is_pinned": False,
                    "session_no": session_no,
                    "messages": []
                }
                chat_sessions_collection.insert_one(session)
                logger.info(f"[ROUTE] Created new session: {session['session_id']}")
                session_id = session["session_id"]

            # ===== Generate bot response using new function =====
            logger.debug(f"[ROUTE] Calling generate_llm_response_with_session")
            
            try:
                response_text, sentiment_score = generate_llm_response_with_session(
                    user_message=message,
                    username=email,  # Using email as username identifier
                    session_id=session_id,
                    chatbot_tools=chatbot_tools
                )


                logger.debug(f"[ROUTE] Response received: {response_text[:100]}...")
            except Exception as e:
                logger.error(f"[ROUTE] Error generating response: {e}", exc_info=True)
                return jsonify({"error": "Failed to generate response"}), 500

            # Get updated session title
            updated_session = chat_sessions_collection.find_one({"session_id": session_id})
            title = updated_session.get("title", "New Chat") if updated_session else "New Chat"

            logger.debug(f"[ROUTE] Successfully processed message, returning response")
            return jsonify({
                "reply": response_text,
                "sentiment_score": sentiment_score,
                "session_id": session_id,
                "session_title": title
            })

        except Exception as e:
            logger.error(f"[ROUTE] Error processing authenticated request: {e}", exc_info=True)
            return jsonify({"error": "Authentication or processing failed"}), 500

    # Handle unauthenticated users (simplified - no session support)
    else:
        logger.debug("[ROUTE] No access token found, processing unauthenticated user")
        logger.warning("[ROUTE] Unauthenticated users not supported in new architecture")
        return jsonify({
            "error": "Authentication required",
            "message": "Please log in to use the chat feature"
        }), 401

# ===== SESSION MANAGEMENT ENDPOINTS =====

@chatbot_routes.route("/chat/sessions", methods=["POST"])
def get_user_sessions():
    """Get all chat sessions for a user, grouped by date"""
    logger.debug("Received request to get user chat sessions")
    
    try:
        data = request.get_json()
        access_token = data.get("access_token")
        
        if not access_token:
            logger.warning("No access token provided")
            return jsonify({"error": "Access token required"}), 401
        
        # Decode token to get user info
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        
        if not email:
            logger.warning("Invalid token - no email found")
            return jsonify({"error": "Invalid token"}), 401
        
        # Get user
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404
        
        # Get all sessions for user, sorted by updated_at desc
        sessions = list(chat_sessions_collection.find(
            {"user_id": user["user_id"]},
            {"messages": 0}  # Exclude messages for performance
        ).sort("updated_at", -1))
        
        # Convert ObjectId to string and format dates
        for session in sessions:
            session["_id"] = str(session["_id"])
            if isinstance(session.get("created_at"), datetime):
                session["created_at"] = session["created_at"].isoformat()
            if isinstance(session.get("updated_at"), datetime):
                session["updated_at"] = session["updated_at"].isoformat()
        
        # Group sessions by date
        grouped_sessions = group_sessions_by_date(sessions)
        
        logger.info(f"Retrieved {len(sessions)} sessions for user {email}")
        return jsonify({
            "sessions": sessions,
            "grouped_sessions": grouped_sessions,
            "total_count": len(sessions)
        })
        
    except Exception as e:
        logger.error(f"Error getting user sessions: {e}", exc_info=True)
        return jsonify({"error": "Failed to retrieve sessions"}), 500


@chatbot_routes.route("/chat/sessions/<session_id>", methods=["POST"])
def get_session_with_messages(session_id):
    """Get a specific session with all its messages"""
    logger.debug(f"Received request to get session {session_id}")
    
    try:
        data = request.get_json()
        access_token = data.get("access_token")
        
        if not access_token:
            logger.warning("No access token provided")
            return jsonify({"error": "Access token required"}), 401
        
        # Decode token to get user info
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        
        if not email:
            logger.warning("Invalid token - no email found")
            return jsonify({"error": "Invalid token"}), 401
        
        # Get user
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404
        
        # Get session
        session = chat_sessions_collection.find_one({
            "session_id": session_id,
            "user_id": user["user_id"]
        })
        
        if not session:
            logger.warning(f"Session {session_id} not found for user {email}")
            return jsonify({"error": "Session not found"}), 404
        
        # Format session
        session["_id"] = str(session["_id"])
        if isinstance(session.get("created_at"), datetime):
            session["created_at"] = session["created_at"].isoformat()
        if isinstance(session.get("updated_at"), datetime):
            session["updated_at"] = session["updated_at"].isoformat()
        
        # Format message timestamps
        # for msg in session.get("messages", []):
        #     if isinstance(msg.get("timestamp"), datetime):
        #         msg["timestamp"] = msg["timestamp"].isoformat()
        
        logger.info(f"Retrieved session {session_id} with {len(session.get('messages', []))} messages")
        return jsonify(session)
        
    except Exception as e:
        logger.error(f"Error getting session {session_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to retrieve session"}), 500

@chatbot_routes.route("/chat/sessions/<session_id>/pin", methods=["PUT"])
def toggle_pin_session(session_id):
    """Toggle pin status of a chat session"""
    logger.debug(f"Received request to toggle pin for session {session_id}")
    
    try:
        data = request.get_json()
        access_token = data.get("access_token")
        
        if not access_token:
            logger.warning("No access token provided")
            return jsonify({"error": "Access token required"}), 401
        
        # Decode token to get user info
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        
        if not email:
            logger.warning("Invalid token - no email found")
            return jsonify({"error": "Invalid token"}), 401
        
        # Get user
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404
        
        # Get session
        session = chat_sessions_collection.find_one({
            "session_id": session_id,
            "user_id": user["user_id"]
        })
        
        if not session:
            logger.warning(f"Session {session_id} not found for user {email}")
            return jsonify({"error": "Session not found"}), 404
        
        # Toggle pin status
        new_pin_status = not session.get("is_pinned", False)
        
        # Update session
        chat_sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "is_pinned": new_pin_status,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        logger.info(f"Toggled pin status for session {session_id} to {new_pin_status}")
        return jsonify({"session_id": session_id, "is_pinned": new_pin_status})
        
    except Exception as e:
        logger.error(f"Error toggling pin for session {session_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to toggle pin"}), 500

@chatbot_routes.route("/chat/sessions/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Delete a chat session"""
    logger.debug(f"Received request to delete session {session_id}")
    
    try:
        data = request.get_json()
        access_token = data.get("access_token")
        
        if not access_token:
            logger.warning("No access token provided")
            return jsonify({"error": "Access token required"}), 401
        
        # Decode token to get user info
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        
        if not email:
            logger.warning("Invalid token - no email found")
            return jsonify({"error": "Invalid token"}), 401
        
        # Get user
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404
        
        # Delete session
        result = chat_sessions_collection.delete_one({
            "session_id": session_id,
            "user_id": user["user_id"]
        })
        
        if result.deleted_count == 0:
            logger.warning(f"Session {session_id} not found for user {email}")
            return jsonify({"error": "Session not found"}), 404
        
        logger.info(f"Deleted session {session_id} for user {email}")
        return jsonify({"message": "Session deleted successfully"})
        
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete session"}), 500

@chatbot_routes.route("/chat/sessions/create", methods=["POST"])
def create_new_session():
    """Create a new chat session manually"""
    logger.debug("Received request to create new chat session")
    
    try:
        data = request.get_json()
        access_token = data.get("access_token")
        
        if not access_token:
            logger.warning("No access token provided")
            return jsonify({"error": "Access token required"}), 401
        
        # Decode token to get user info
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        
        if not email:
            logger.warning("Invalid token - no email found")
            return jsonify({"error": "Invalid token"}), 401
        
        # Get user
        user = users_collection.find_one({"email": email})
        if not user:
            logger.warning(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404
        

        user_sessions_count = chat_sessions_collection.count_documents({"user_id": user["user_id"]})
        session_no = user_sessions_count + 1
        
        # Create new session
        now = datetime.now(timezone.utc)
        date_group = now.strftime("%Y-%m-%d")
        
        session_data = {
            "session_id": str(uuid.uuid4()),
            "user_id": user["user_id"],
            "email": email,
            "title": "New Chat",
            "created_at": now,
            "updated_at": now,
            "date_group": date_group,
            "message_count": 0,
            "is_pinned": False,
            "session_no": session_no,
            "messages": []
        }
        
        # Insert session
        result = chat_sessions_collection.insert_one(session_data)
        session_data["_id"] = str(result.inserted_id)
        
        # Format dates for JSON response
        session_data["created_at"] = session_data["created_at"].isoformat()
        session_data["updated_at"] = session_data["updated_at"].isoformat()
        
        logger.info(f"Created new chat session {session_data['session_id']} for user {email}")
        return jsonify(session_data), 201
        
    except Exception as e:
        logger.error(f"Error creating chat session: {e}", exc_info=True)
        return jsonify({"error": "Failed to create session"}), 500




@chatbot_routes.route("/api/generate_selfcare_pdf", methods=["POST"])
def generate_selfcare_pdf():
    data = request.get_json()
    user_id = data.get("user_id")
    mail = Mail()

    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    user = users_collection.find_one({"user_id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    email = user["email"]
    username = user["username"]

    chats = list(chats_collection.find({"user_id": user_id}))
    if not chats:
        return jsonify({"error": "No chat history found"}), 404

    analyzer = SentimentIntensityAnalyzer()
    print("here pdf")
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt=f"Self-Care Plan for {username}", ln=True, align='C')
    print("here 1")
    pdf.ln(10)

    avg_sentiment = 0
    num_chats = len(chats)

    for chat in chats:
        print("here 2")
        timestamp = chat["timestamp"].strftime("%Y-%m-%d %H:%M:%S")
        user_message = chat["user_message"]
        scores = analyzer.polarity_scores(user_message)
        sentiment_score = (scores["compound"] + 1) / 2
        avg_sentiment += sentiment_score

        pdf.multi_cell(0 , 10 , f"[{timestamp}] {username}: {user_message}")
        pdf.multi_cell(0, 10, f"[{timestamp}] Bot: {chat['bot_response']}")
        pdf.multi_cell(0, 10, f"Sentiment Score: {sentiment_score:.2f}", border="B")
        pdf.ln(5)

    avg_sentiment /= num_chats

    print("here 3")
    pdf.add_page()
    pdf.cell(200, 10, txt="Personalized Self-Care Plan", ln=True, align='C')
    pdf.ln(10)

    if avg_sentiment < 0.4:
        print("here 4")
        pdf.multi_cell(0, 10, "Your mood has been quite low recently. A structured self-care routine can help improve your emotional well-being. Follow these personalized steps to feel better:")

        steps = [
            "Wake-up Routine (7:30 AM): Start your day with exposure to natural sunlight for at least 10 minutes. Sunlight helps regulate your circadian rhythm and boosts serotonin levels, which improve mood.",
            "Mindful Breathing (4-7-8 method, twice daily): Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. This technique helps activate the parasympathetic nervous system, reducing stress and anxiety.",
            "Journaling Prompt: 'Write about a moment when you felt truly happy and what made it special.' Writing about positive experiences can help rewire your brain to focus on the good.",
            "Nutrition Tip: Begin your day with a protein-rich breakfast (e.g., eggs, yogurt, nuts) to stabilize blood sugar and energy levels.",
            "Evening Relaxation: Listen to calming music or nature sounds before bed to promote relaxation and improve sleep quality.",
            "Social Connection: Reach out to one person today, even if it's just a short message. Social interaction releases oxytocin, which helps reduce stress."
        ]
        for i, step in enumerate(steps, 1):
            pdf.multi_cell(0, 10, f"{i}. {step}")

    elif avg_sentiment < 0.7:
        print("here 5")
        pdf.multi_cell(0, 10, "Your mood appears balanced, and maintaining a structured self-care routine will help sustain your well-being. Here's a set of habits to reinforce emotional stability and boost happiness:")

        steps = [
            "Morning Gratitude Exercise: Upon waking, list three things you're grateful for. Practicing gratitude increases dopamine and serotonin levels, improving emotional resilience.",
            "Light Exercise (15 minutes of yoga/stretching): Engaging in physical movement helps release endorphins and reduces stress hormones like cortisol.",
            "Mindful Breaks: Take short breaks throughout your day. Have a warm cup of tea or coffee without distractions. Being present in small moments reduces mental fatigue.",
            "Bedtime Wind-Down: Read for 10 minutes before sleep instead of using screens. This promotes melatonin production and enhances sleep quality.",
            "Creative Expression: Engage in a hobby such as painting, music, or crafting. Creativity provides a sense of accomplishment and joy."
        ]
        for i, step in enumerate(steps, 1):
            pdf.multi_cell(0, 10, f"{i}. {step}")

    else:
        print("here 8")
        pdf.multi_cell(0, 10, "You are experiencing a period of positive emotions and high energy. Maintain this momentum with habits that reinforce positivity and personal growth:")

        steps = [
            "Daily Physical Activity (20 minutes minimum): Exercise is proven to enhance cognitive function, improve mood, and increase energy levels.",
            "Social Engagement: Plan an outing with friends or family. Social interactions strengthen emotional bonds and reduce stress.",
            "Personal Growth Challenge: Set a new goal for yourself—whether it's learning a skill, taking an online course, or working towards a passion project.",
            "Sleep Hygiene: Maintain a regular sleep schedule and aim for 7-8 hours of quality sleep to support cognitive function and emotional balance."
        ]
        for i, step in enumerate(steps, 1):
            pdf.multi_cell(0, 10, f"{i}. {step}")

    print("here 9")
    pdf.ln(10)
    pdf.cell(200, 10, "Stay positive, be kind to yourself, and take care!", ln=True, align='C')

    pdf_output = BytesIO()
    print("here 10")
    pdf_output.write(pdf.output(dest="S").encode("latin-1"))
    pdf_output.seek(0)

    msg = Message("Your Personalized Self-Care Plan", sender="mitrahelpline123@gmail.com", recipients=[email])
    msg.body = "Attached is your self-care plan based on your chat history and sentiment analysis."
    msg.attach("self_care_plan.pdf", "application/pdf", pdf_output.getvalue())
    mail.send(msg)

    return jsonify({"message": "Self-care plan sent successfully to email."})

@chatbot_routes.route("/voice_chat", methods=["POST"])
def voice_chat():
    logger.debug("Received /voice_chat request")

    try:
        # ===== Check if audio file exists =====
        if "audio" not in request.files:
            logger.warning("No audio file found in request")
            return jsonify({"error": "Audio file is required"}), 400

        audio_file = request.files["audio"]
        logger.debug(f"Audio file received: {audio_file.filename}")

        # ===== Get optional access token =====
        access_token = request.form.get("access_token")
        if not access_token or access_token.lower() == "null":
            access_token = None
        logger.debug(f"Access token received: {bool(access_token)}")

        # ===== Get optional session_id =====
        session_id = request.form.get("session_id")
        if not session_id or session_id.lower() == "null" or session_id == "":
            session_id = None
        logger.debug(f"Session ID received: {session_id}")

        # ===== Transcription Step (Gemini) =====
        try:
            UPLOAD_DIR = "uploads"
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            temp_path = os.path.join(UPLOAD_DIR, "uploaded_audio.mp3")
            audio_file.save(temp_path)

            # Upload to Gemini
            myfile = client.files.upload(file=temp_path)

            prompt = """You are an AI transcription assistant.  
                        Your task is to accurately transcribe the provided audio recording into text.  

                        Instructions:
                        - Do not summarize or paraphrase.  
                        - Write out the exact spoken words.  
                        - Preserve natural pauses, filler words, and incomplete sentences.  
                        - Format as plain text transcript.  
                        - If audio is unclear, mark it as [inaudible].
                        - Do not add commentary.
                        - Use punctuation to reflect the natural flow of speech."""

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, myfile]
            )

            message = response.text.strip()
            logger.debug(f"Transcription result: {message}")

        except Exception as e:
            logger.error(f"Error during transcription: {e}", exc_info=True)
            return jsonify({"error": "Failed to transcribe audio"}), 500

        finally:
            # Always clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # ===== Handle authentication =====
        if not access_token:
            logger.debug("No access token. Voice chat requires authentication")
            return jsonify({
                "error": "Authentication required",
                "message": "Please log in to use voice chat"
            }), 401

        # ===== Decode token =====
        try:
            decoded_token = decode_token(access_token)
            email = decoded_token.get("sub")
            user = users_collection.find_one({"email": email})

            if not user:
                logger.warning(f"No user found for email: {email}")
                return jsonify({"error": "User not found"}), 404

            user_id = user["user_id"]
            username = user.get("username", "User")
            logger.debug(f"Authenticated user: {email}, ID: {user_id}")

        except Exception as e:
            logger.error(f"Error decoding token: {e}", exc_info=True)
            return jsonify({"error": "Invalid or expired token"}), 401

        # ===== Get or Create Session =====
        if session_id:
            session = chat_sessions_collection.find_one({
                "session_id": session_id,
                "user_id": user_id
            })
            if not session:
                logger.warning(f"Session {session_id} not found for user {email}")
                return jsonify({"error": "Session not found"}), 404
            logger.debug(f"Using existing session: {session_id}")
        else:
            now = datetime.now(timezone.utc)
            today = now.strftime("%Y-%m-%d")

            user_sessions_count = chat_sessions_collection.count_documents({"user_id": user_id})
            session_no = user_sessions_count + 1

            session = {
                "session_id": str(uuid.uuid4()),
                "user_id": user_id,
                "email": email,
                "title": "New Chat",
                "created_at": now,
                "updated_at": now,
                "date_group": today,
                "message_count": 0,
                "is_pinned": False,
                "session_no": session_no,
                "messages": []
            }
            chat_sessions_collection.insert_one(session)
            logger.info(f"Created new session: {session['session_id']}")
            session_id = session["session_id"]

        # ===== Generate LLM Response =====
        try:
            response_text, sentiment_score = generate_llm_response_with_session(
                user_message=message,
                username=email,
                session_id=session_id,
                chatbot_tools=chatbot_tools
            )
            logger.debug(f"Voice response received: {response_text[:100]}...")
        except Exception as e:
            logger.error(f"Error generating voice response: {e}", exc_info=True)
            return jsonify({"error": "Failed to generate response"}), 500


        # ===== Generate TTS Audio =====
        try:
            audio = elevenlabs.text_to_speech.convert(
                text=response_text,
                voice_id="JBFqnCBsd6RMkjVDRZzb",
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )
            audio_bytes = b"".join(audio)
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            logger.debug("Audio conversion successful")
        except Exception as e:
            logger.error(f"Error generating TTS: {e}", exc_info=True)
            audio_base64 = None

        # ===== Return Final Response =====
        return jsonify({
            "reply": response_text,
            "sentiment_score": sentiment_score,
            "user_message": message,
            "audio": audio_base64,
            "session_id": session_id
        })

    except Exception as e:
        logger.error(f"Unexpected error in /voice_chat: {e}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
