from flask import request, jsonify
from app.routes import tracking_routes
from app.models import tracking_collection , analytics_collection , chats_collection
from app.utils.logger_utils import get_logger
from flask_jwt_extended import decode_token
from bson import ObjectId
import datetime
import re
from collections import defaultdict


logger = get_logger(__name__)

@tracking_routes.route('/tracking/user', methods=['POST'])
def get_user_tracking_data():
    """
    Get user tracking data for recommendation system using JWT authentication
    Returns user visit patterns and time spent on pages
    """
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        logger.info(f"Access token received: {access_token}")
        if not access_token:
            return jsonify({
                "error": "Access token is required",
                "message": "No access token provided"
            }), 401
        
        # Decode JWT token to extract email
        try:
            decoded_token = decode_token(access_token)
            email = decoded_token.get('sub')
            logger.info(f"Email extracted from token: {email}")
            if not email:
                return jsonify({
                    "error": "Invalid token",
                    "message": "Email not found in token"
                }), 401
                
        except Exception as token_error:
            logger.error(f"[ERROR] Token decoding failed: {str(token_error)}")
            return jsonify({
                "error": "Invalid token",
                "message": "Failed to decode access token"
            }), 401
        
        logger.info(f"[INFO] Fetching tracking data for authenticated user: {email}")
        
        # Find user tracking data in MongoDB
        user_data = tracking_collection.find_one({"email": email})
        logger.info("User data found: ", user_data)
        if not user_data:
            logger.info(f"[INFO] No tracking data found for user: {email}")
            return jsonify({
                "message": "No tracking data found for user",
                "user_visits": []
            }), 404
        
        # Return user visits data
        user_visits = user_data.get('user_visits', [])
        logger.info(f"[INFO] Found {len(user_visits)} visit groups for user: {email}")
        
        return jsonify({
            "email": email,
            "user_visits": user_visits,
            "total_visit_groups": len(user_visits)
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Error fetching tracking data: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to fetch tracking data"
        }), 500

@tracking_routes.route('/tracking/user/update', methods=['POST'])
def update_user_tracking_data():
    """
    Update user tracking data with new page visit using JWT authentication
    Used by frontend to track user behavior
    """
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        page = data.get('page')
        time_spent = data.get('timeSpent', '0 seconds')
        
        if not access_token:
            return jsonify({
                "error": "Access token is required",
                "message": "No access token provided"
            }), 401
        
        if not page:
            return jsonify({"error": "Page parameter is required"}), 400
        
        # Decode JWT token to extract email
        try:
            decoded_token = decode_token(access_token)
            email = decoded_token.get('email')
            
            if not email:
                return jsonify({
                    "error": "Invalid token",
                    "message": "Email not found in token"
                }), 401
                
        except Exception as token_error:
            logger.error(f"[ERROR] Token decoding failed: {str(token_error)}")
            return jsonify({
                "error": "Invalid token",
                "message": "Failed to decode access token"
            }), 401
        
        logger.info(f"[INFO] Updating tracking data for authenticated user: {email}, page: {page}")
    
        timestamp = datetime.datetime.utcnow().isoformat() + 'Z'
        
        # Create new visit entry
        new_visit = {
            "page": page,
            "timeSpent": time_spent,
            "timestamp": timestamp
        }
        
        # Update or create user tracking document
        result = tracking_collection.update_one(
            {"email": email},
            {
                "$push": {
                    "user_visits": {
                        "count": 1,
                        "visits": [new_visit]
                    }
                }
            },
            upsert=True
        )
        
        if result.upserted_id:
            logger.info(f"[INFO] Created new tracking document for user: {email}")
        else:
            logger.info(f"[INFO] Updated tracking data for user: {email}")
        
        return jsonify({
            "message": "Tracking data updated successfully",
            "visit": new_visit
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Error updating tracking data: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to update tracking data"
        }), 500

@tracking_routes.route('/tracking/analytics/<email>', methods=['GET'])
def get_user_analytics(email):
    """
    Get analytics data for user behavior analysis
    Returns aggregated statistics for recommendation system
    """
    try:
        logger.info(f"[INFO] Generating analytics for user: {email}")
        
         
        user_data = tracking_collection.find_one({"email": email})
        
        if not user_data:
            return jsonify({
                "message": "No analytics data available",
                "analytics": {}
            }), 404
        
        # Calculate analytics
        user_visits = user_data.get('user_visits', [])
        page_stats = {}
        total_time = 0
        total_visits = 0
        
        for visit_group in user_visits:
            for visit in visit_group.get('visits', []):
                page = visit.get('page')
                time_spent_str = visit.get('timeSpent', '0 seconds')
                time_spent = float(time_spent_str.replace(' seconds', '')) if 'seconds' in time_spent_str else 0
                
                if page not in page_stats:
                    page_stats[page] = {
                        'total_time': 0,
                        'visit_count': 0,
                        'avg_time': 0
                    }
                
                page_stats[page]['total_time'] += time_spent
                page_stats[page]['visit_count'] += 1
                total_time += time_spent
                total_visits += 1
        
        # Calculate averages
        for page in page_stats:
            if page_stats[page]['visit_count'] > 0:
                page_stats[page]['avg_time'] = page_stats[page]['total_time'] / page_stats[page]['visit_count']
        
        # Find most visited page
        most_visited_page = max(page_stats.keys(), key=lambda x: page_stats[x]['total_time']) if page_stats else None
        
        analytics = {
            "total_time_spent": total_time,
            "total_visits": total_visits,
            "unique_pages": len(page_stats),
            "page_statistics": page_stats,
            "most_visited_page": most_visited_page,
            "avg_session_time": total_time / total_visits if total_visits > 0 else 0
        }
        
        logger.info(f"[INFO] Generated analytics for user: {email} - {len(page_stats)} unique pages")
        
        return jsonify({
            "email": email,
            "analytics": analytics
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Error generating analytics for {email}: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to generate analytics"
        }), 500

@tracking_routes.route('/tracking/recommendation-event', methods=['POST'])
def log_recommendation_event():
    """
    Log recommendation system events for analytics using JWT authentication
    Tracks user interactions with recommendations
    """
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        logger.info(f"Access token received: {access_token}")
        event_type = data.get('eventType')
        timestamp = data.get('timestamp')
        event_data = data.get('data', {})
        
        if not access_token:
            return jsonify({
                "error": "Access token is required",
                "message": "No access token provided"
            }), 401
        
        if not event_type:
            return jsonify({"error": "eventType is required"}), 400
        
        # Decode JWT token to extract email
        try:
            decoded_token = decode_token(access_token)
            email = decoded_token.get('sub')
            
            if not email:
                return jsonify({
                    "error": "Invalid token",
                    "message": "Email not found in token"
                }), 401
                
        except Exception as token_error:
            logger.error(f"[ERROR] Token decoding failed: {str(token_error)}")
            return jsonify({
                "error": "Invalid token",
                "message": "Failed to decode access token"
            }), 401
        
        logger.info(f"[INFO] Logging recommendation event for authenticated user: {email}, type: {event_type}")
        
        # Store in recommendation analytics collection
        
        event_record = {
            "email": email,
            "event_type": event_type,
            "timestamp": timestamp or datetime.datetime.utcnow().isoformat() + 'Z',
            "data": event_data,
            "created_at": datetime.datetime.utcnow()
        }
        
        result = analytics_collection.insert_one(event_record)
        
        logger.info(f"[INFO] Recommendation event logged with ID: {result.inserted_id}")
        
        return jsonify({
            "message": "Event logged successfully",
            "event_id": str(result.inserted_id)
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Error logging recommendation event: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to log recommendation event"
        }), 500


import datetime
from collections import defaultdict
import re

def analyze_user_behavior(user_visits):
    """
    Analyze user behavior patterns to generate intelligent recommendations
    
    Args:
        user_visits (list): List of visit groups from tracking data
                           Each group contains: {"count": int, "visits": [{"page": str, "timeSpent": str, "timestamp": str}]}
    
    Returns:
        dict: Analysis result with recommendation decision
    """
    try:
        if not user_visits:
            return {
                "shouldRecommend": False,
                "message": "No visit data available for analysis",
                "confidence": 0.0
            }
        
        # Flatten all visits and aggregate page statistics
        page_stats = defaultdict(lambda: {
            'total_time': 0,
            'visit_count': 0,
            'timestamps': [],
            'avg_time': 0
        })
        
        total_visits = 0
        all_timestamps = []
        
        # Process all visit groups
        for visit_group in user_visits:
            visits = visit_group.get('visits', [])
            for visit in visits:
                page = visit.get('page', '').strip()
                time_spent_str = visit.get('timeSpent', '0 seconds')
                timestamp_str = visit.get('timestamp', '')
                
                # Parse time spent (expecting format like "45 seconds" or "2 minutes")
                time_spent = _parse_time_spent(time_spent_str)
                
                # Parse timestamp
                try:
                    if timestamp_str:
                        # Handle ISO format with Z suffix
                        if timestamp_str.endswith('Z'):
                            timestamp_str = timestamp_str[:-1] + '+00:00'
                        timestamp = datetime.datetime.fromisoformat(timestamp_str)
                        # Make timezone-naive for consistent comparison
                        if timestamp.tzinfo is not None:
                            timestamp = timestamp.replace(tzinfo=None)
                    else:
                        timestamp = datetime.datetime.utcnow()
                except:
                    timestamp = datetime.datetime.utcnow()
                
                # Update page statistics
                if page:  # Only count valid pages
                    page_stats[page]['total_time'] += time_spent
                    page_stats[page]['visit_count'] += 1
                    page_stats[page]['timestamps'].append(timestamp)
                    total_visits += 1
                    all_timestamps.append(timestamp)
        
        if not page_stats:
            return {
                "shouldRecommend": False,
                "message": "No valid page visits found",
                "confidence": 0.0
            }
        
        # Calculate average time per visit for each page
        for page in page_stats:
            if page_stats[page]['visit_count'] > 0:
                page_stats[page]['avg_time'] = page_stats[page]['total_time'] / page_stats[page]['visit_count']
        
        # Apply recommendation algorithm
        recommendation = _calculate_recommendation(page_stats, all_timestamps)
        
        return recommendation
        
    except Exception as e:
        return {
            "shouldRecommend": False,
            "message": f"Error analyzing user behavior: {str(e)}",
            "confidence": 0.0
        }

def _parse_time_spent(time_spent_str):
    """Parse time spent string to seconds"""
    try:
        time_spent_str = str(time_spent_str).lower().strip()
        
        # Extract number and unit
        if 'minute' in time_spent_str:
            match = re.search(r'(\d+(?:\.\d+)?)', time_spent_str)
            if match:
                return float(match.group(1)) * 60
        elif 'second' in time_spent_str:
            match = re.search(r'(\d+(?:\.\d+)?)', time_spent_str)
            if match:
                return float(match.group(1))
        elif 'hour' in time_spent_str:
            match = re.search(r'(\d+(?:\.\d+)?)', time_spent_str)
            if match:
                return float(match.group(1)) * 3600
        else:
            # Try to extract just the number (assume seconds)
            match = re.search(r'(\d+(?:\.\d+)?)', time_spent_str)
            if match:
                return float(match.group(1))
        
        return 0.0
    except:
        return 0.0

def _calculate_recommendation(page_stats, all_timestamps):
    """Calculate recommendation based on user behavior patterns"""
    
    # Define page categories and their weights
    page_categories = {
        '/chat': {'category': 'mental_health', 'weight': 1.0},
        '/chat-bot': {'category': 'mental_health', 'weight': 1.0},
        '/music_generation': {'category': 'creative_therapy', 'weight': 0.9},
        '/music-player': {'category': 'entertainment', 'weight': 0.7},
        '/home': {'category': 'navigation', 'weight': 0.3},
        '/dashboard': {'category': 'navigation', 'weight': 0.3},
        '/profile': {'category': 'account', 'weight': 0.4},
        '/settings': {'category': 'account', 'weight': 0.3}
    }
    
    # Calculate engagement scores for each page
    page_scores = {}
    # Ensure now is timezone-naive to match parsed timestamps
    now = datetime.datetime.utcnow()
    
    for page, stats in page_stats.items():
        # Base engagement score (time spent + visit frequency)
        base_score = (stats['total_time'] * 0.1) + (stats['visit_count'] * 5.0) + (stats['avg_time'] * 0.2)
        
        # Recency factor (more recent visits get higher scores)
        if stats['timestamps']:
            latest_visit = max(stats['timestamps'])
            # Ensure both datetimes are timezone-naive
            if latest_visit.tzinfo is not None:
                latest_visit = latest_visit.replace(tzinfo=None)
            days_since_visit = (now - latest_visit).days
            recency_factor = max(0.1, 1.0 - (days_since_visit * 0.1))
        else:
            recency_factor = 0.1
        
        # Category weight
        page_info = page_categories.get(page, {'category': 'other', 'weight': 0.5})
        category_weight = page_info['weight']
        
        # Calculate final score
        final_score = base_score * recency_factor * category_weight
        
        page_scores[page] = {
            'score': final_score,
            'base_score': base_score,
            'recency_factor': recency_factor,
            'category_weight': category_weight,
            'category': page_info['category'],
            'total_time': stats['total_time'],
            'visit_count': stats['visit_count'],
            'avg_time': stats['avg_time'],
            'last_visit': max(stats['timestamps']).replace(tzinfo=None).isoformat() if stats['timestamps'] else None
        }
    
    # Find the best recommendation
    if not page_scores:
        return {
            "shouldRecommend": False,
            "message": "No valid pages to recommend",
            "confidence": 0.0
        }
    
    # Sort pages by score
    sorted_pages = sorted(page_scores.items(), key=lambda x: x[1]['score'], reverse=True)
    best_page, best_stats = sorted_pages[0]
    
    # Calculate confidence based on score distribution
    max_score = best_stats['score']
    if len(sorted_pages) > 1:
        second_score = sorted_pages[1][1]['score']
        confidence = min(0.95, max_score / (max_score + second_score + 1))
    else:
        confidence = min(0.95, max_score / 100.0)
    
    # Minimum thresholds for recommendation
    min_confidence = 0.3
    min_engagement_time = 30  # seconds
    min_visits = 1
    
    # Check if we should recommend
    should_recommend = (
        confidence >= min_confidence and
        best_stats['total_time'] >= min_engagement_time and
        best_stats['visit_count'] >= min_visits and
        max_score > 10.0  # Minimum score threshold
    )
    
    if should_recommend:
        return {
            "shouldRecommend": True,
            "page": best_page,
            "confidence": round(confidence, 3),
            "totalTime": best_stats['total_time'],
            "visitCount": best_stats['visit_count'],
            "avgTimePerVisit": round(best_stats['avg_time'], 2),
            "category": best_stats['category'],
            "lastVisit": best_stats['last_visit'],
            "score": round(best_stats['score'], 2),
            "message": f"Recommended based on {best_stats['visit_count']} visits and {best_stats['total_time']:.0f}s engagement"
        }
    else:
        return {
            "shouldRecommend": False,
            "message": f"Insufficient engagement data (confidence: {confidence:.2f}, threshold: {min_confidence})",
            "confidence": round(confidence, 3),
            "topPage": best_page,
            "topPageStats": {
                "totalTime": best_stats['total_time'],
                "visitCount": best_stats['visit_count'],
                "score": round(best_stats['score'], 2)
            }
        }

def generate_recommendation_reason(analysis):
    """Generate human-readable reason for the recommendation"""
    try:
        page = analysis.get('page', '')
        visit_count = analysis.get('visitCount', 0)
        total_time = analysis.get('totalTime', 0)
        category = analysis.get('category', 'general')
        
        # Generate contextual reasons
        if category == 'mental_health':
            if visit_count >= 3:
                return f"You've frequently used mental health features ({visit_count} visits). Continue your wellness journey?"
            else:
                return f"Based on your {total_time:.0f}s engagement, you might benefit from more mental health support."
        
        elif category == 'creative_therapy':
            return f"Your {visit_count} music sessions suggest you enjoy creative therapy. Ready for another session?"
        
        elif category == 'entertainment':
            return f"You've spent {total_time:.0f}s enjoying entertainment. Time for more relaxation?"
        
        else:
            return f"You've shown interest in {page.replace('/', '').replace('-', ' ')} ({visit_count} visits). Want to explore more?"
    
    except:
        return "Based on your recent activity patterns, this might interest you."

@tracking_routes.route('/tracking/recommendation-stats/<email>', methods=['GET'])
def get_recommendation_stats(email):
    """
    Get recommendation system statistics for a user
    Returns analytics about recommendation performance
    """
    try:
        logger.info(f"[INFO] Fetching recommendation stats for user: {email}")
        
        
        # Get all events for this user
        events = list(analytics_collection.find({"email": email}))
        
        if not events:
            return jsonify({
                "message": "No recommendation stats available",
                "stats": {}
            }), 404
        
        # Calculate statistics
        stats = {
            "total_events": len(events),
            "recommendations_shown": 0,
            "recommendations_accepted": 0,
            "recommendations_dismissed": 0,
            "analysis_completed": 0,
            "errors": 0,
            "acceptance_rate": 0,
            "avg_analysis_time": 0
        }
        
        analysis_times = []
        
        for event in events:
            event_type = event.get('event_type')
            if event_type == 'recommendation_shown':
                stats['recommendations_shown'] += 1
            elif event_type == 'recommendation_accepted':
                stats['recommendations_accepted'] += 1
            elif event_type == 'recommendation_dismissed':
                stats['recommendations_dismissed'] += 1
            elif event_type == 'analysis_completed':
                stats['analysis_completed'] += 1
                if 'analysisTime' in event.get('data', {}):
                    analysis_times.append(event['data']['analysisTime'])
            elif event_type == 'error':
                stats['errors'] += 1
        
        # Calculate rates
        if stats['recommendations_shown'] > 0:
            stats['acceptance_rate'] = (stats['recommendations_accepted'] / stats['recommendations_shown']) * 100
        
        if analysis_times:
            stats['avg_analysis_time'] = sum(analysis_times) / len(analysis_times)
        
        logger.info(f"[INFO] Generated recommendation stats for user: {email}")
        
        return jsonify({
            "email": email,
            "stats": stats,
            "last_updated": datetime.datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Error fetching recommendation stats for {email}: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to generate smart recommendation"
        }), 500

@tracking_routes.route('/tracking/smart-recommendation/<email>', methods=['GET'])
def get_smart_recommendation(email):
    """
    Get advanced recommendation using the recommendation engine
    Returns intelligent page recommendations with confidence scores
    """
    try:
        logger.info(f"[INFO] Generating smart recommendation for user: {email}")
        
      
        user_data = tracking_collection.find_one({"email": email})
        
        if not user_data:
            return jsonify({
                "message": "No tracking data found for smart recommendations",
                "recommendation": None
            }), 404
        
        # Use advanced recommendation engine
        user_visits = user_data.get('user_visits', [])
        analysis = analyze_user_behavior(user_visits)
        
        if analysis.get('shouldRecommend'):
            recommendation = {
                "page": analysis['page'],
                "confidence": analysis['confidence'],
                "total_time": analysis['totalTime'],
                "visit_count": analysis['visitCount'],
                "last_visit": analysis.get('lastVisit'),
                "avg_time_per_visit": analysis.get('avgTimePerVisit'),
                "category": analysis.get('category'),
                "reason": generate_recommendation_reason(analysis),
                "confidence_level": analysis.get('confidence', 0.0)
            }
            
            logger.info(f"[INFO] Smart recommendation generated for {email}: {analysis['page']} (confidence: {analysis['confidence']:.2f})")

            if analysis['page'] in ['/chat', '/chat-bot', '/music_generation']:
                chat_history = list(chats_collection.find({"email": email}).sort("timestamp", -1).limit(5))
                if analysis['page'] in ['/chat', '/chat-bot']:
                    recommendation['intelligentPrompt'] = _generate_chatbot_prompt(chat_history)
                elif analysis['page'] == '/music_generation':
                    recommendation['intelligentPrompt'] = _generate_music_prompt(chat_history)
            
            return jsonify({
                "email": email,
                "recommendation": recommendation,
                "generated_at": datetime.datetime.utcnow().isoformat()
            }), 200
        else:
            logger.info(f"[INFO] No smart recommendation for {email}: {analysis.get('message')}")
            return jsonify({
                "email": email,
                "recommendation": None,
                "message": analysis.get('message'),
                "confidence": analysis.get('confidence', 0.0)
            }), 200
            
    except Exception as e:
        logger.error(f"[ERROR] Error generating smart recommendation for {email}: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to generate smart recommendation"
        }), 500


@tracking_routes.route('/tracking/intelligent-recommendation', methods=['POST'])
def get_intelligent_recommendation():
    """
    Generate intelligent recommendation with auto-generated prompts based on chat history
    Routes to appropriate page with pre-filled prompts
    """
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        logger.info(f"Access token received: {access_token}")
        
        if not access_token:
            return jsonify({
                "error": "Access token is required",
                "message": "No access token provided"
            }), 401
        
        # Decode JWT token to extract email
        try:
            decoded_token = decode_token(access_token)
            email = decoded_token.get('sub')
            if not email:
                return jsonify({
                    "error": "Invalid token",
                    "message": "Email not found in token"
                }), 401
        except Exception as token_error:
            return jsonify({
                "error": "Invalid token",
                "message": "Failed to decode access token"
            }), 401
        
        # Get user tracking data
        user_data = tracking_collection.find_one({"email": email})
        logger.info(f"User data found: {user_data}")
        if not user_data:
            return jsonify({
                "shouldRecommend": False,
                "message": "No tracking data available"
            }), 404
        
        # Analyze behavior using existing engine
        user_visits = user_data.get('user_visits', [])
        logger.info(f"User visits found: {user_visits}")
        analysis = analyze_user_behavior(user_visits)
        logger.info(f"Analysis result: {analysis}")
        if not analysis.get('shouldRecommend'):
            return jsonify(analysis), 200
        
        recommended_page = analysis['page']
        logger.info(f"Recommended page: {recommended_page}")
        
        # Generate intelligent prompt based on recommended page
        intelligent_prompt = None
        if recommended_page in ['/chat', '/chat-bot']:
            # Get recent chat history for chatbot recommendations
            chat_history = list(chats_collection.find({"email": email}).sort("timestamp", -1).limit(10))
            intelligent_prompt = _generate_chatbot_prompt(chat_history)
        elif recommended_page == '/music_generation':
            # Get chat history for music generation
            chat_history = list(chats_collection.find({"email": email}).sort("timestamp", -1).limit(10))
            intelligent_prompt = _generate_music_prompt(chat_history)
        
        # Add prompt to analysis result
        analysis['intelligentPrompt'] = intelligent_prompt
        analysis['targetPage'] = recommended_page
        logger.info(f"Intelligent recommendation result: {analysis}")
        
        return jsonify(analysis), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Error generating intelligent recommendation: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": "Failed to generate intelligent recommendation"
        }), 500

def _generate_chatbot_prompt(chat_history):
    """Generate intelligent chatbot prompt based on chat history"""
    try:
        if not chat_history:
            return "How are you feeling today? I'm here to help with any concerns."
        
        # Extract recent topics/themes from chat history
        recent_messages = []
        for chat in chat_history[:5]:  # Last 5 conversations
            if 'user_message' in chat:
                recent_messages.append(chat['user_message'])
        
        if not recent_messages:
            return "I noticed you've been using the chat feature. How can I assist you today?"
        
        # Use LLM to generate contextual prompt
        context = " ".join(recent_messages[-3:])  # Last 3 messages for context
        
        llm_prompt = f"""Based on my recent conversations ({context}), generate a short, empathetic follow-up question that I (the user) could ask you (the bot) to naturally continue my mental health journey.

        Guidelines:

        Keep it under 100 characters.

        Make it warm, supportive, and conversational.

        Ensure it connects with the context of my previous conversation.

        Examples of how I might ask you:

        'Can you help me with more coping strategies today?'

        'What are some ways I can manage these feelings better?'

        'Could you guide me through the next step we discussed?'

        Now, generate one supportive question that I could realistically ask you."""
        
        response = llm.invoke(llm_prompt)
        generated_prompt = response.content.strip().replace('"', '')
        
        return generated_prompt[:100]  # Ensure under 100 chars
        
    except Exception as e:
        logger.error(f"Error generating chatbot prompt: {str(e)}")
        return "I'm here to continue our conversation. How are you feeling?"

def _generate_music_prompt(chat_history):
    """Generate intelligent music generation prompt based on chat history"""
    try:
        if not chat_history:
            return "Create a calming melody to help with relaxation"
        
        # Extract emotional themes from chat history
        recent_emotions = []
        for chat in chat_history[:5]:
            if 'sentiment_score' in chat:
                recent_emotions.append(chat['sentiment_score'])
            if 'user_message' in chat:
                # Simple keyword extraction
                message = chat['user_message'].lower()
                if any(word in message for word in ['stress', 'anxious', 'worried']):
                    recent_emotions.append(0.2)  # Low sentiment
                elif any(word in message for word in ['happy', 'good', 'better']):
                    recent_emotions.append(0.8)  # High sentiment
        
        if not recent_emotions:
            return "Generate music that matches your current emotional state"
        
        # Calculate average sentiment
        avg_sentiment = sum(recent_emotions) / len(recent_emotions)
        
        # Generate music prompt based on sentiment
        if avg_sentiment < 0.3:
            prompt_base = "soothing, calming music with gentle piano and soft strings to ease anxiety and stress"
        elif avg_sentiment < 0.5:
            prompt_base = "peaceful, meditative music with nature sounds and ambient tones for emotional balance"
        elif avg_sentiment < 0.7:
            prompt_base = "uplifting, gentle music with warm melodies to maintain positive mood"
        else:
            prompt_base = "cheerful, energizing music with bright tones and positive rhythms"
        
        return f"Create {prompt_base}"
        
    except Exception as e:
        logger.error(f"Error generating music prompt: {str(e)}")
        return "Generate music that reflects your emotional journey"