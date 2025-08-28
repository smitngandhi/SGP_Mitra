"""
Smart User Recommendation Agent for Mitra Platform
Analyzes user behavior patterns and provides intelligent recommendations
"""

import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import threading
import schedule
from app.models import tracking_collection, recommendation_llm
from app.utils.logger_utils import get_logger
from langchain.schema import HumanMessage, SystemMessage

logger = get_logger(__name__)

class UserRecommendationAgent:
    """
    Intelligent User Behavior Analysis and Recommendation Agent
    """
    
    def __init__(self):
        self.running = False
        self.scheduler_thread = None
        logger.info("[INFO] UserRecommendationAgent initialized")
        
    def start_background_service(self):
        """Start the background recommendation service"""
        if self.running:
            logger.warning("[WARNING] Recommendation service already running")
            return
            
        self.running = True
        
        # Schedule analysis every 5 minutes
        schedule.every(5).minutes.do(self._analyze_all_users)
        
        # Start scheduler in separate thread
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("[INFO] Background recommendation service started")
        
    def stop_background_service(self):
        """Stop the background recommendation service"""
        self.running = False
        schedule.clear()
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("[INFO] Background recommendation service stopped")
        
    def _run_scheduler(self):
        """Run the scheduler in background thread"""
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(1)
            except Exception as e:
                logger.error(f"[ERROR] Scheduler error: {str(e)}")
                
    def _analyze_all_users(self):
        """Analyze all users and generate recommendations"""
        try:
            logger.info("[INFO] Starting user behavior analysis cycle")
            
            # Get all users with tracking data
            users = list(tracking_collection.find({}))
            logger.info(f"[INFO] Found {len(users)} users to analyze")
            
            for user_data in users:
                try:
                    self._analyze_user_behavior(user_data)
                except Exception as e:
                    logger.error(f"[ERROR] Failed to analyze user {user_data.get('email', 'unknown')}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"[ERROR] Failed to analyze users: {str(e)}")
            
    def _analyze_user_behavior(self, user_data: Dict) -> Optional[Dict]:
        """
        Analyze individual user behavior and generate recommendations
        
        Args:
            user_data: User tracking data from MongoDB
            
        Returns:
            Recommendation data or None if no recommendation needed
        """
        try:
            email = user_data.get('email')
            user_visits = user_data.get('user_visits', [])
            
            if not email or not user_visits:
                logger.debug(f"[DEBUG] No sufficient data for user {email}")
                return None
                
            # Calculate time spent per page across all historical sessions
            page_time_analysis = self._calculate_page_time_spent(user_visits)
            
            if not page_time_analysis:
                logger.debug(f"[DEBUG] No valid page data for user {email}")
                return None
                
            # Find most engaging page
            recommended_page = self._find_most_engaging_page(page_time_analysis)
            
            if not recommended_page:
                logger.debug(f"[DEBUG] No recommendation generated for user {email}")
                return None
                
            # Generate intelligent recommendation
            recommendation = self._generate_recommendation(email, recommended_page, page_time_analysis)
            
            if recommendation:
                # Store recommendation for frontend retrieval
                self._store_recommendation(email, recommendation)
                logger.info(f"[INFO] Generated recommendation for user {email}: {recommended_page}")
                
            return recommendation
            
        except Exception as e:
            logger.error(f"[ERROR] User behavior analysis failed: {str(e)}")
            return None
            
    def _calculate_page_time_spent(self, user_visits: List[Dict]) -> Dict[str, float]:
        """
        Calculate total time spent on each page across all sessions
        
        Args:
            user_visits: List of user visit sessions
            
        Returns:
            Dictionary mapping page paths to total time spent (in seconds)
        """
        page_times = defaultdict(float)
        
        try:
            for session in user_visits:
                visits = session.get('visits', [])
                
                for visit in visits:
                    page = visit.get('page', '')
                    time_spent_str = visit.get('timeSpent', '0 seconds')
                    
                    # Parse time spent string (e.g., "4.30 seconds")
                    time_seconds = self._parse_time_string(time_spent_str)
                    
                    if page and time_seconds > 0:
                        page_times[page] += time_seconds
                        
            return dict(page_times)
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to calculate page times: {str(e)}")
            return {}
            
    def _parse_time_string(self, time_str: str) -> float:
        """
        Parse time string to seconds
        
        Args:
            time_str: Time string like "4.30 seconds" or "2.5 minutes"
            
        Returns:
            Time in seconds as float
        """
        try:
            time_str = time_str.lower().strip()
            
            if 'second' in time_str:
                return float(time_str.split()[0])
            elif 'minute' in time_str:
                return float(time_str.split()[0]) * 60
            elif 'hour' in time_str:
                return float(time_str.split()[0]) * 3600
            else:
                # Try to extract number
                import re
                numbers = re.findall(r'\d+\.?\d*', time_str)
                return float(numbers[0]) if numbers else 0.0
                
        except (ValueError, IndexError):
            logger.warning(f"[WARNING] Could not parse time string: {time_str}")
            return 0.0
            
    def _find_most_engaging_page(self, page_times: Dict[str, float]) -> Optional[str]:
        """
        Find the page where user spent most time
        
        Args:
            page_times: Dictionary of page -> total time spent
            
        Returns:
            Most engaging page path or None
        """
        if not page_times:
            return None
            
        # Filter out login/register pages for recommendations
        filtered_pages = {
            page: time_spent 
            for page, time_spent in page_times.items() 
            if page not in ['/login', '/register', '/logout', '/']
        }
        
        if not filtered_pages:
            return None
            
        # Find maximum time spent
        max_time = max(filtered_pages.values())
        
        # Get all pages with maximum time (for tie-breaking)
        top_pages = [page for page, time_spent in filtered_pages.items() if time_spent == max_time]
        
        # Random selection for tie-breaking
        return random.choice(top_pages)
        
    def _generate_recommendation(self, email: str, recommended_page: str, page_analysis: Dict[str, float]) -> Optional[Dict]:
        """
        Generate intelligent recommendation using LLM
        
        Args:
            email: User email
            recommended_page: Page to recommend
            page_analysis: Complete page time analysis
            
        Returns:
            Recommendation dictionary or None
        """
        try:
            # Get API documentation for the recommended page
            api_docs = self._get_relevant_api_docs(recommended_page)
            
            # Create context for LLM
            context = self._create_recommendation_context(recommended_page, page_analysis, api_docs)
            
            # Generate recommendation using LLM
            system_prompt = """You are an intelligent recommendation agent for the Mitra mental health platform. 
            Generate a concise, helpful recommendation message based on user behavior analysis.
            
            Your response should be a JSON object with:
            {
                "message": "Brief, encouraging message about why this page is recommended",
                "features": "Key features/APIs available on this page",
                "reasoning": "Brief explanation of why this recommendation makes sense"
            }
            
            Keep messages under 100 words, friendly, and focused on user value."""
            
            human_prompt = f"""Based on user behavior analysis:
            
            Recommended Page: {recommended_page}
            User's Page Usage Pattern: {context}
            Available APIs/Features: {api_docs}
            
            Generate a personalized recommendation message."""
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_prompt)
            ]
            
            response = recommendation_llm(messages)
            
            # Parse LLM response
            import json
            try:
                recommendation_data = json.loads(response.content)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                recommendation_data = {
                    "message": f"Based on your usage patterns, we recommend revisiting {self._get_page_display_name(recommended_page)}",
                    "features": api_docs[:100] if api_docs else "Explore the available features",
                    "reasoning": "You've spent significant time here before"
                }
            
            return {
                "email": email,
                "recommended_page": recommended_page,
                "page_display_name": self._get_page_display_name(recommended_page),
                "frontend_url": f"http://localhost:3000{recommended_page}",
                "recommendation_data": recommendation_data,
                "generated_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to generate recommendation: {str(e)}")
            return None
            
    def _create_recommendation_context(self, recommended_page: str, page_analysis: Dict[str, float], api_docs: str) -> str:
        """Create context string for LLM recommendation generation"""
        total_time = page_analysis.get(recommended_page, 0)
        other_pages = {k: v for k, v in page_analysis.items() if k != recommended_page}
        
        context = f"User spent {total_time:.1f} seconds on {recommended_page}. "
        
        if other_pages:
            avg_other_time = sum(other_pages.values()) / len(other_pages)
            context += f"Average time on other pages: {avg_other_time:.1f} seconds. "
            
        return context
        
    def _get_relevant_api_docs(self, page_path: str) -> str:
        """
        Get relevant API documentation for a page
        
        Args:
            page_path: Frontend page path
            
        Returns:
            Relevant API documentation string
        """
        # Map frontend pages to API documentation
        page_api_mapping = {
            '/assessment': 'Know Your Mind: PHQ-9, GAD-7 assessments, mental health scoring, progress tracking',
            '/chat-bot': 'MindChat: AI therapeutic conversations, voice chat, chat history, personalized responses',
            '/music_generation': 'ZenBeats: AI music generation, mood-based therapy music, personalized playlists',
            '/selfcare': 'SelfCare: Wellness reports, personal insights, recommendations, progress analytics',
            '/emergency': 'Emergency Help: Crisis resources, emergency contacts, immediate support services',
            '/profile': 'User Account: Profile management, preferences, settings, account information',
            '/voice_assistant': 'Voice Assistant: Voice-based interactions, speech-to-text, audio responses',
            '/meditation': 'Meditation: Guided meditation sessions, mindfulness exercises, relaxation techniques',
            '/breathing': 'Breathing Exercises: Breathing patterns, stress relief, anxiety management techniques'
        }
        
        return page_api_mapping.get(page_path, 'Explore platform features and capabilities')
        
    def _get_page_display_name(self, page_path: str) -> str:
        """Get user-friendly display name for page path"""
        page_names = {
            '/assessment': 'Know Your Mind',
            '/chat-bot': 'MindChat',
            '/music_generation': 'ZenBeats',
            '/selfcare': 'SelfCare',
            '/emergency': 'Emergency Help',
            '/profile': 'User Profile',
            '/voice_assistant': 'Voice Assistant',
            '/meditation': 'Meditation',
            '/breathing': 'Breathing Exercises',
            '/test': 'Assessment Tests'
        }
        
        return page_names.get(page_path, page_path.replace('/', '').replace('_', ' ').title())
        
    def _store_recommendation(self, email: str, recommendation: Dict):
        """Store recommendation in database for frontend retrieval"""
        try:
            # Store in recommendations collection
            recommendations_collection = tracking_collection.database['recommendations']
            
            # Update or insert recommendation
            recommendations_collection.update_one(
                {"email": email},
                {"$set": recommendation},
                upsert=True
            )
            
            logger.debug(f"[DEBUG] Stored recommendation for user {email}")
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to store recommendation: {str(e)}")
            
    def get_user_recommendation(self, email: str) -> Optional[Dict]:
        """
        Get current recommendation for a user
        
        Args:
            email: User email
            
        Returns:
            Current recommendation or None
        """
        try:
            recommendations_collection = tracking_collection.database['recommendations']
            
            recommendation = recommendations_collection.find_one({"email": email})
            
            if not recommendation:
                return None
                
            # Check if recommendation is still valid
            expires_at = datetime.fromisoformat(recommendation['expires_at'])
            if datetime.utcnow() > expires_at:
                # Remove expired recommendation
                recommendations_collection.delete_one({"email": email})
                return None
                
            return recommendation
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to get user recommendation: {str(e)}")
            return None
            
    def mark_recommendation_used(self, email: str):
        """Mark recommendation as used by user"""
        try:
            recommendations_collection = tracking_collection.database['recommendations']
            recommendations_collection.delete_one({"email": email})
            logger.debug(f"[DEBUG] Marked recommendation as used for user {email}")
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to mark recommendation as used: {str(e)}")

# Global instance
recommendation_agent = UserRecommendationAgent()
