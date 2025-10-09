#!/usr/bin/env python3
"""
Migration script to integrate existing chats into the new session-based system
and add session functionality to existing chatbot routes.
"""

import os
import sys
from datetime import datetime, timezone
import uuid
from collections import defaultdict

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.models import chats_collection, chat_sessions_collection, users_collection
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)

def generate_simple_title(messages):
    """Generate a simple title from the first user message"""
    if not messages:
        return "New Chat"
    
    first_user_msg = None
    for msg in messages:
        if msg.get('role') == 'user' or msg.get('user_message'):
            first_user_msg = msg.get('content') or msg.get('user_message', '')
            break
    
    if not first_user_msg:
        return "Mental Health Chat"
    
    # Take first 4 words and capitalize
    words = first_user_msg.split()[:4]
    title = " ".join(words).title()
    
    if len(title) < 3:
        return "Mental Health Chat"
    
    return title

def migrate_existing_chats():
    """Migrate existing flat chat structure to session-based structure"""
    logger.info("Starting migration of existing chats to session-based structure")
    
    try:
        # Get all existing chats
        existing_chats = list(chats_collection.find().sort("timestamp", 1))
        logger.info(f"Found {len(existing_chats)} existing chat messages")
        
        if not existing_chats:
            logger.info("No existing chats to migrate")
            return
        
        # Group chats by user and date
        sessions_by_user_date = defaultdict(lambda: {
            'messages': [],
            'user_info': None,
            'date_group': None,
            'created_at': None,
            'updated_at': None
        })
        
        for chat in existing_chats:
            user_id = chat.get('user_id')
            email = chat.get('email', 'unknown')
            timestamp = chat.get('timestamp')
            
            if not user_id or not timestamp:
                logger.warning(f"Skipping chat with missing user_id or timestamp: {chat.get('_id')}")
                continue
            
            # Convert timestamp to datetime if it's a string
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except ValueError:
                    logger.warning(f"Invalid timestamp format: {timestamp}")
                    continue
            
            # Ensure timestamp is timezone-aware
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            
            date_group = timestamp.strftime('%Y-%m-%d')
            key = f"{user_id}_{date_group}"
            
            session_data = sessions_by_user_date[key]
            
            # Set session metadata
            if not session_data['user_info']:
                session_data['user_info'] = {
                    'user_id': user_id,
                    'email': email
                }
                session_data['date_group'] = date_group
                session_data['created_at'] = timestamp
            
            current_updated_at = session_data.get('updated_at')
            if current_updated_at is None:
                session_data['updated_at'] = timestamp
            else:
                session_data['updated_at'] = max(current_updated_at, timestamp)

            
            # Add user message
            if chat.get('user_message'):
                session_data['messages'].append({
                    'message_id': str(uuid.uuid4()),
                    'role': 'user',
                    'content': chat['user_message'],
                    'timestamp': timestamp,
                    'sentiment_score': chat.get('sentiment_score')
                })
            
            # Add bot response
            if chat.get('bot_response'):
                session_data['messages'].append({
                    'message_id': str(uuid.uuid4()),
                    'role': 'assistant',
                    'content': chat['bot_response'],
                    'timestamp': timestamp
                })
        
        logger.info(f"Grouped chats into {len(sessions_by_user_date)} sessions")
        
        # Create session documents
        sessions_created = 0
        sessions_skipped = 0
        
        for session_data in sessions_by_user_date.values():
            if not session_data['messages']:
                continue
            
            # Check if session already exists for this user and date
            existing_session = chat_sessions_collection.find_one({
                'user_id': session_data['user_info']['user_id'],
                'date_group': session_data['date_group']
            })
            
            if existing_session:
                logger.info(f"Session already exists for user {session_data['user_info']['user_id']} on {session_data['date_group']}, skipping...")
                sessions_skipped += 1
                continue
            
            # Generate title from messages
            title = generate_simple_title(session_data['messages'])
            
            # Create session document
            session_doc = {
                'session_id': str(uuid.uuid4()),
                'user_id': session_data['user_info']['user_id'],
                'email': session_data['user_info']['email'],
                'title': title,
                'created_at': session_data['created_at'],
                'updated_at': session_data['updated_at'],
                'date_group': session_data['date_group'],
                'message_count': len(session_data['messages']),
                'is_pinned': False,
                'messages': session_data['messages']
            }
            
            # Insert session
            try:
                chat_sessions_collection.insert_one(session_doc)
                sessions_created += 1
                logger.debug(f"Created session {session_doc['session_id']} with {len(session_data['messages'])} messages")
            except Exception as e:
                logger.error(f"Error creating session: {e}")
        
        logger.info(f"Migration completed successfully!")
        logger.info(f"Sessions created: {sessions_created}")
        logger.info(f"Sessions skipped (already exist): {sessions_skipped}")
        logger.info("Note: Original chats collection remains unchanged for backup purposes")
        
    except Exception as e:
        logger.error(f"Error during migration: {e}", exc_info=True)
        raise

def add_session_integration_to_chatbot():
    """
    Instructions for manually integrating session functionality into chatbot_routes.py
    """
    
    integration_code = '''
# Add this import at the top of chatbot_routes.py:
from app.models import chat_sessions_collection

# Add this new endpoint after the existing chat() function:

@chatbot_routes.route("/api/chat/session", methods=["POST"])
def chat_with_session():
    """New chat endpoint that integrates with session management"""
    logger.debug("Received chat request with session management")
    data = request.get_json()
    message = data["message"]
    session_id = data.get("session_id")  # Optional - will create/get today's session if not provided
    logger.debug(f"User message: {message}, Session ID: {session_id}")

    if "access_token" in data and data["access_token"]:
        logger.debug("Access token found, processing authenticated user")
        access_token = data["access_token"]
        decoded_token = decode_token(access_token)
        email = decoded_token.get("sub")
        user = users_collection.find_one({"email": email})
        logger.debug(f"User found: {user}")

        if not user:
            logger.warning(f"User not found for email: {email}")
            return jsonify({"error": "User not found"}), 404

        chatbot_preference = user["chatbot_preference"]
        username = user["username"]
        user_id = user["user_id"]
        
        # Get or create session
        if session_id:
            # Use provided session
            session = chat_sessions_collection.find_one({
                "session_id": session_id,
                "user_id": user_id
            })
            if not session:
                logger.warning(f"Session {session_id} not found for user {email}")
                return jsonify({"error": "Session not found"}), 404
        else:
            # Get or create today's session
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            session = chat_sessions_collection.find_one({
                "user_id": user_id,
                "date_group": today
            })
            
            if not session:
                # Create new session for today
                now = datetime.now(timezone.utc)
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
                    "messages": []
                }
                chat_sessions_collection.insert_one(session)
                logger.info(f"Created new session for today: {session['session_id']}")

        # Generate bot response
        logger.debug(f"Getting response from LLM for message. Calling generate_llm_response_sentiment")
        response_text, sentiment_score = generate_llm_response_sentiment(message, chatbot_preference, username)
        logger.debug(f"Response text: {response_text}")

        # Add user message to session
        now = datetime.now(timezone.utc)
        user_message = {
            "message_id": str(uuid.uuid4()),
            "role": "user",
            "content": message,
            "timestamp": now,
            "sentiment_score": sentiment_score
        }

        # Add bot response to session
        bot_message = {
            "message_id": str(uuid.uuid4()),
            "role": "assistant",
            "content": response_text,
            "timestamp": now
        }

        # Update session with new messages
        updated_messages = session.get("messages", []) + [user_message, bot_message]
        
        # Generate title if this is the first user message
        title = session.get("title", "New Chat")
        if title == "New Chat" and len([m for m in updated_messages if m.get("role") == "user"]) == 1:
            # Simple title generation based on first message
            title_words = message.split()[:4]  # First 4 words
            title = " ".join(title_words).title()
            if len(title) < 3:
                title = "Mental Health Chat"

        # Update session in database
        chat_sessions_collection.update_one(
            {"session_id": session["session_id"]},
            {
                "$set": {
                    "messages": updated_messages,
                    "message_count": len(updated_messages),
                    "updated_at": now,
                    "title": title
                }
            }
        )

        # Also save to old chats collection for backward compatibility
        chat_entry = {
            "user_id": user["user_id"],
            "email": user["email"],
            "user_message": message,
            "bot_response": response_text,
            "timestamp": now,
            "sentiment_score": sentiment_score,
            "session_id": session["session_id"]  # Link to session
        }
        chats_collection.insert_one(chat_entry)
        logger.debug("Chat entry inserted into database")

        return jsonify({
            "reply": response_text,
            "sentiment_score": sentiment_score,
            "session_id": session["session_id"],
            "session_title": title
        })

    # Handle unauthenticated users (same as before but with session creation)
    logger.debug("No access token found, processing unauthenticated user")
    response_text, sentiment_score = generate_llm_response_sentiment(message, None, None)
    logger.debug(f"Response text for unauthenticated user: {response_text}")

    # Create temporary session for unauthenticated user
    temp_user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    
    temp_session = {
        "session_id": str(uuid.uuid4()),
        "user_id": temp_user_id,
        "email": "unauthenticated",
        "title": "Anonymous Chat",
        "created_at": now,
        "updated_at": now,
        "date_group": today,
        "message_count": 2,
        "is_pinned": False,
        "messages": [
            {
                "message_id": str(uuid.uuid4()),
                "role": "user",
                "content": message,
                "timestamp": now,
                "sentiment_score": sentiment_score
            },
            {
                "message_id": str(uuid.uuid4()),
                "role": "assistant", 
                "content": response_text,
                "timestamp": now
            }
        ]
    }
    
    chat_sessions_collection.insert_one(temp_session)

    # Also save to old chats collection
    chat_entry = {
        "user_id": temp_user_id,
        "user_message": message,
        "bot_response": response_text,
        "timestamp": now,
        "email": "unauthenticated",
        "sentiment_score": sentiment_score,
        "session_id": temp_session["session_id"]
    }
    chats_collection.insert_one(chat_entry)
    logger.debug("Chat entry for unauthenticated user inserted into database")
    
    return jsonify({
        "reply": response_text,
        "sentiment_score": sentiment_score,
        "session_id": temp_session["session_id"],
        "session_title": "Anonymous Chat"
    })
'''
    
    print("=" * 80)
    print("MANUAL INTEGRATION REQUIRED")
    print("=" * 80)
    print("\nPlease manually add the following code to chatbot_routes.py:")
    print(integration_code)
    print("=" * 80)

if __name__ == "__main__":
    print("SGP Mitra - Chat Sessions Migration Script")
    print("=" * 50)
    
    choice = input("\nChoose an option:\n1. Migrate existing chats to sessions\n2. Show integration code for chatbot_routes.py\n3. Both\n\nEnter choice (1/2/3): ")
    
    if choice in ['1', '3']:
        print("\nStarting chat migration...")
        migrate_existing_chats()
        print("✅ Migration completed!")
    
    if choice in ['2', '3']:
        print("\nShowing integration code...")
        add_session_integration_to_chatbot()
    
    print("\n🎉 All done! Your chat system now supports sessions!")
