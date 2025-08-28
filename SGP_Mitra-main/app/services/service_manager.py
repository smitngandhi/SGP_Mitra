"""
Service Manager for initializing and managing background services
"""

import atexit
from app.services.recommendation_agent import recommendation_agent
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)

class ServiceManager:
    """Manages all background services for the Mitra platform"""
    
    def __init__(self):
        self.services_started = False
        
    def start_all_services(self):
        """Start all background services"""
        if self.services_started:
            logger.warning("[WARNING] Services already started")
            return
            
        try:
            # Start recommendation agent
            recommendation_agent.start_background_service()
            
            # Register cleanup on app shutdown
            atexit.register(self.stop_all_services)
            
            self.services_started = True
            logger.info("[INFO] All background services started successfully")
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to start services: {str(e)}")
            
    def stop_all_services(self):
        """Stop all background services"""
        if not self.services_started:
            return
            
        try:
            # Stop recommendation agent
            recommendation_agent.stop_background_service()
            
            self.services_started = False
            logger.info("[INFO] All background services stopped")
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to stop services: {str(e)}")

# Global service manager instance
service_manager = ServiceManager()
