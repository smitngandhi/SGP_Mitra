
"""
Session-aware LLM Response Generator for Mental Health Chatbot
Integrates session memory, Pinecone retrieval, and initialize_agent
"""

from langchain.agents import AgentType, initialize_agent
from langchain.memory import ConversationBufferMemory
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.models import llm, users_collection, chat_sessions_collection
from app.utils.logger_utils import get_logger
from app.utils.session_manager import (
    load_previous_session_to_memory,
    store_message_in_pinecone,
    retrieve_similar_messages,
    format_similar_messages_context
)
import datetime

logger = get_logger(__name__)

# Global dictionary to store session-specific memories
# Format: {username: {session_id: ConversationBufferMemory}}
session_memories = {}


def generate_llm_response_with_session(user_message, username, session_id, chatbot_tools):
    """
    Generate LLM response with session-aware memory and Pinecone retrieval
    
    Args:
        user_message (str): User's input message
        username (str): Username/email of the user
        session_id (str): Current session ID
        chatbot_tools (list): List of tools for the agent
        
    Returns:
        tuple: (response_text, sentiment_score)
    """
    logger.debug(f"[GENERATE_LLM] Function called with user_message: '{user_message}', username: '{username}', session_id: '{session_id}'")
    
    # Initialize sentiment analyzer
    analyzer = SentimentIntensityAnalyzer()
    scores = analyzer.polarity_scores(user_message)
    compound_score = scores['compound']
    sentiment_score = (compound_score + 1) / 2
    logger.debug(f"[GENERATE_LLM] Sentiment score calculated: {sentiment_score}")
    
    # Display name
    user = users_collection.find_one({"email": username})
    username = user['username']
    display_name = username if username else "user"
    logger.debug(f"[GENERATE_LLM] Display name set to: '{display_name}'")
    
    # ===== STEP 1: Initialize or retrieve session memory =====
    logger.debug(f"[GENERATE_LLM] STEP 1: Initializing session memory")
    
    if username not in session_memories:
        session_memories[username] = {}
        logger.debug(f"[GENERATE_LLM] Created new memory dict for username: '{username}'")
    
    if session_id not in session_memories[username]:
        logger.debug(f"[GENERATE_LLM] New session detected, loading previous session data")
        
        # Load previous session into memory
        memory = load_previous_session_to_memory(username, session_id)
        session_memories[username][session_id] = memory
        
        logger.debug(f"[GENERATE_LLM] Previous session loaded into memory for session: {session_id}")
    else:
        logger.debug(f"[GENERATE_LLM] Using existing session memory for session: {session_id}")
        memory = session_memories[username][session_id]
        print(memory)
    
    # ===== STEP 2: Retrieve similar messages from Pinecone =====
    logger.debug(f"[GENERATE_LLM] STEP 2: Retrieving similar messages from Pinecone")
    
    pinecone_context = retrieve_similar_messages(username, user_message, top_k=3)
    logger.debug(f"[GENERATE_LLM] Retrieved {len(pinecone_context)} similar messages")
    print(pinecone_context)
    
    # # Format similar messages as context
    # pinecone_context = format_similar_messages_context(similar_messages)
    # logger.debug(f"[GENERATE_LLM] Formatted Pinecone context, length: {len(pinecone_context)} characters")
    
    # ===== STEP 3: Define system prompt with Pinecone context =====
    logger.debug(f"[GENERATE_LLM] STEP 3: Composing system prompt")

    
    
    system_prompt = f"""You are Mitra, a versatile and compassionate AI assistant created to support {display_name}. While you specialize in mental health and emotional wellness, you're also capable of engaging in regular conversations, answering general questions, and providing assistance across a wide range of topics - just like ChatGPT.

🎯 **Your Dual Role:**

**1. Mental Health Support Specialist:**
- Provide empathetic, evidence-based guidance for mental health concerns
- Offer coping strategies, self-care recommendations, and emotional support
- Recognize crisis situations and provide appropriate resources
- Help users understand mental health conditions and treatment options

**2. General AI Assistant:**
- Answer questions on any topic (science, technology, history, culture, etc.)
- Help with problem-solving, brainstorming, and creative tasks
- Provide explanations, definitions, and educational content
- Engage in casual conversation and friendly chat
- Assist with coding, writing, analysis, and more

💬 **Communication Style:**
- Be warm, approachable, and natural in all conversations
- Match the tone to the context (serious for mental health, casual for general chat)
- Provide clear, concise, and helpful responses
- Use appropriate formatting (lists, bold, etc.) when it improves clarity
- Be honest about limitations and uncertainties

📚 **Available Context:**

*Previous Relevant Conversations:*
{pinecone_context}

🎭 **Adapting to User Needs:**
- For mental health topics: Be extra empathetic, validate feelings, and prioritize safety
- For general questions: Be informative, accurate, and engaging
- For casual chat: Be friendly, natural, and conversational
- For technical queries: Be precise, detailed, and practical

🔒 **Important Guidelines:**
- For mental health emergencies, always provide crisis resources (988, 911, Crisis Text Line)
- You're supportive but not a replacement for professional mental health care
- For general topics, provide accurate information to the best of your knowledge
- Admit when you don't know something rather than guessing
- Maintain user privacy and confidentiality

Remember: You're here to be helpful, supportive, and informative - whether {display_name} needs emotional support, wants to learn something new, needs help with a task, or just wants to chat. Be the assistant they need in this moment. 💙"""
    
    logger.debug(f"[GENERATE_LLM] System prompt created, length: {len(system_prompt)} characters")
    
    # Ensure system prompt is in memory
    if not any(isinstance(turn, dict) and turn.get('input') == 'system' for turn in getattr(memory, 'buffer', [])):
        memory.save_context({"input": "system"}, {"output": system_prompt})
        logger.debug(f"[GENERATE_LLM] System prompt saved to memory")
    
    # ===== STEP 4: Initialize agent with tools and memory =====
    logger.debug(f"[GENERATE_LLM] STEP 4: Initializing agent with tools")
    
    mental_health_chatbot = initialize_agent(
        tools=chatbot_tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True,
        handle_parsing_errors=True,
        memory=memory
    )
    
    logger.debug(f"[GENERATE_LLM] Agent initialized successfully")
    
    # ===== STEP 5: Get response from agent =====
    logger.debug(f"[GENERATE_LLM] STEP 5: Invoking agent with user message")
    
    try:
        response = mental_health_chatbot.run(f'{user_message} + "Previous relevant conversations are provided above to help you respond appropriately." + "{pinecone_context}"')
        logger.debug(f"[GENERATE_LLM] Agent response received: {response[:100]}...")
        memory.save_context(
            {"input": user_message},
            {"output": response}
        )
    except Exception as e:
        logger.error(f"[GENERATE_LLM] Error getting agent response: {e}", exc_info=True)
        response = "I apologize, but I'm having trouble processing your request right now. Please try again or contact support if the issue persists."
    
    # ===== STEP 6: Store in Pinecone =====
    logger.debug(f"[GENERATE_LLM] STEP 6: Storing message in Pinecone")
    
    if user_message.strip() and username:
        store_message_in_pinecone(username, session_id, user_message, response)
        logger.debug(f"[GENERATE_LLM] Message stored in Pinecone successfully")
    
    # ===== STEP 7: Update session in MongoDB =====
    logger.debug(f"[GENERATE_LLM] STEP 7: Updating session in MongoDB")
    
    try:
        session = chat_sessions_collection.find_one({"session_id": session_id})
        
        if session:
            updated_messages = session.get("messages", [])
            updated_messages.append({"user": user_message})
            updated_messages.append({"bot": response})
            
            # Generate title if first message
            title = session.get("title", "New Chat")
            if title == "New Chat" and len([m for m in updated_messages if "user" in m]) == 1:
                from app.routes.chatbot_routes import generate_chat_title
                title = generate_chat_title([
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": response}
                ])
            
            # Update session
            chat_sessions_collection.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "messages": updated_messages,
                        "message_count": len(updated_messages),
                        "updated_at": datetime.datetime.now(datetime.timezone.utc),
                        "title": title
                    }
                }
            )
            logger.debug(f"[GENERATE_LLM] Session updated in MongoDB")
        else:
            logger.warning(f"[GENERATE_LLM] Session {session_id} not found in MongoDB")
    
    except Exception as e:
        logger.error(f"[GENERATE_LLM] Error updating session in MongoDB: {e}", exc_info=True)
    
    logger.debug(f"[GENERATE_LLM] Returning response and sentiment_score")
    return response, sentiment_score