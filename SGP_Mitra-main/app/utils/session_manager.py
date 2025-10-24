"""
Session Manager for Mental Health Chatbot
Handles session memory loading, Pinecone storage, and retrieval
"""

from langchain.memory import ConversationBufferMemory
from app.models import chat_sessions_collection
from app.utils.logger_utils import get_logger
import datetime
import uuid
from app.utils import initialize_pinecone

dense_index = initialize_pinecone()

logger = get_logger(__name__)


def load_previous_session_to_memory(username, current_session_id):
    """
    Load all messages from the previous session into ConversationBufferMemory
    
    Args:
        username (str): The username of the user
        current_session_id (str): The current session ID to exclude
        
    Returns:
        ConversationBufferMemory: Memory object with previous session loaded
    """
    logger.debug(f"[SESSION_MANAGER] Loading previous session for username: {username}")
    
    memory = ConversationBufferMemory()
    
    try:
        # Find the user's sessions, sorted by created_at descending
        user_sessions = list(chat_sessions_collection.find(
            {"email": username}  # Assuming email is used as identifier
        ).sort("created_at", -1).limit(1))  # Limit to last 2 sessions
        
        logger.debug(f"[SESSION_MANAGER] Found {len(user_sessions)} total sessions for user")
        
        if len(user_sessions) <= 1:
            logger.debug(f"[SESSION_MANAGER] No previous session found (first session for user)")
            return memory
        
        # Get the previous session (second in the list, since first is current)
        previous_session = None
        for session in user_sessions:
            if session.get('session_id') != current_session_id:
                previous_session = session
                break
        
        if not previous_session:
            logger.debug(f"[SESSION_MANAGER] No previous session found")
            return memory
        
        logger.debug(f"[SESSION_MANAGER] Loading messages from previous session: {previous_session.get('session_id')}")
        
        # Load all messages from previous session into memory
        messages = previous_session.get('messages', [])
        logger.debug(f"[SESSION_MANAGER] Found {len(messages)} messages in previous session")
        
        for msg in messages:
            if 'user' in msg:
                user_message = msg['user']
                # Find corresponding bot response
                bot_response = ""
                msg_index = messages.index(msg)
                if msg_index + 1 < len(messages) and 'bot' in messages[msg_index + 1]:
                    bot_response = messages[msg_index + 1]['bot']
                
                if user_message and bot_response:
                    memory.save_context(
                        {"input": user_message},
                        {"output": bot_response}
                    )
                    logger.debug(f"[SESSION_MANAGER] Loaded message pair into memory")
        
        logger.debug(f"[SESSION_MANAGER] Successfully loaded previous session into memory")
        return memory
        
    except Exception as e:
        logger.error(f"[SESSION_MANAGER] Error loading previous session: {e}", exc_info=True)
        return memory


def store_message_in_pinecone(username, session_id, user_message, bot_response):
    """
    Store individual message in Pinecone with namespace user_{username}
    
    Args:
        username (str): The username
        session_id (str): Current session ID
        user_message (str): User's message
        bot_response (str): Bot's response
    """
    logger.debug(f"[SESSION_MANAGER] Storing message in Pinecone for user: {username}")
    
    try:
        if not user_message.strip():
            logger.debug(f"[SESSION_MANAGER] Empty message, skipping Pinecone storage")
            return
        
        # Create record for user message
        user_record = {
            "_id": str(uuid.uuid4()),
            "chunk_text": user_message,
            "llm_output": bot_response,
            "username": username,
            "session_id": session_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "text": user_message,
            "message_type": "user"
        }
        
        # Create namespace for user
        namespace = f"user_{username}"
        
        logger.debug(f"[SESSION_MANAGER] Upserting to namespace: {namespace}")
        
        # Upsert to Pinecone
        dense_index.upsert_records(namespace, [user_record])
        
        logger.debug(f"[SESSION_MANAGER] Successfully stored message in Pinecone")
        
    except Exception as e:
        logger.error(f"[SESSION_MANAGER] Error storing message in Pinecone: {e}", exc_info=True)


def retrieve_similar_messages(username, user_query, top_k=3):
    """
    Retrieve top K semantically similar messages from Pinecone based on user query
    
    Args:
        username (str): The username
        user_query (str): Current user message to find similar past messages
        top_k (int): Number of similar messages to retrieve (default: 3)
        
    Returns:
        list: List of similar messages with their context
    """
    logger.debug(f"[SESSION_MANAGER] Retrieving similar messages for user: {username}, query: {user_query[:50]}...")
    
    try:
        namespace = f"user_{username}"
        
        # Search Pinecone for similar messages
        results = dense_index.search(
            namespace=namespace,
            query={
                "inputs": {"text": user_query},
                "top_k": top_k
            },
            fields=["chunk_text", "llm_output", "timestamp", "session_id"]
        )
        
        logger.debug(f"[SESSION_MANAGER] Pinecone search completed")
        
        # Extract hits
        hits = results.get('result', {}).get('hits', [])
        logger.debug(f"[SESSION_MANAGER] Found {len(hits)} similar messages")
        
        similar_messages = []
        for hit in hits:
            fields = hit.get('fields', {})
            similar_messages.append({
                'user_message': fields.get('chunk_text', ''),
                'bot_response': fields.get('llm_output', ''),
                'timestamp': fields.get('timestamp', ''),
                'session_id': fields.get('session_id', ''),
                'score': hit.get('score', 0)
            })
        
        logger.debug(f"[SESSION_MANAGER] Returning {len(similar_messages)} similar messages")
        return similar_messages
        
    except Exception as e:
        logger.error(f"[SESSION_MANAGER] Error retrieving similar messages: {e}", exc_info=True)
        return []


def format_similar_messages_context(similar_messages):
    """
    Format similar messages into a context string for the LLM
    
    Args:
        similar_messages (list): List of similar message dictionaries
        
    Returns:
        str: Formatted context string
    """
    if not similar_messages:
        return ""
    
    context = "\n\n=== RELEVANT PAST CONVERSATIONS ===\n"
    context += "Here are some relevant past conversations that might provide context:\n\n"
    
    for i, msg in enumerate(similar_messages, 1):
        context += f"--- Past Conversation {i} ---\n"
        context += f"User: {msg['user_message']}\n"
        context += f"Assistant: {msg['bot_response']}\n"
        context += f"(From session on {msg['timestamp'][:10]})\n\n"
    
    context += "=== END OF PAST CONVERSATIONS ===\n\n"
    
    return context