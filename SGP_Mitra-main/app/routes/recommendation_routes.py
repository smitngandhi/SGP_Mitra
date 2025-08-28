"""
API Routes for Smart User Recommendation Agent
"""

from flask import Blueprint, request, jsonify
from app.services.recommendation_agent import recommendation_agent
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)

recommendation_bp = Blueprint('recommendation', __name__)

@recommendation_bp.route('/get-recommendation', methods=['GET'])
def get_user_recommendation():
    """
    Get personalized recommendation for current user
    
    Returns:
        JSON response with recommendation data or message
    """
    try:
        print(request.args)
        # Get user email from request parameters or use a default test user
        user_email = request.args.get('email', 'test_user@example.com')
        
        logger.info(f"Getting recommendation for user: {user_email}")
        
        # Get recommendation for user
        recommendation = recommendation_agent.get_user_recommendation(user_email)
        
        if not recommendation:
            return jsonify({
                "has_recommendation": False,
                "message": "Getting to know your preferences. Keep exploring!"
            }), 200
            
        return jsonify({
            "has_recommendation": True,
            "recommendation": {
                "page": recommendation.get('recommended_page'),
                "page_display_name": recommendation.get('page_display_name'),
                "frontend_url": recommendation.get('frontend_url'),
                "message": recommendation.get('recommendation_data', {}).get('message', ''),
                "features": recommendation.get('recommendation_data', {}).get('features', ''),
                "reasoning": recommendation.get('recommendation_data', {}).get('reasoning', ''),
                "generated_at": recommendation.get('generated_at')
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user recommendation: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Failed to get recommendation: {str(e)}'
        }), 500

@recommendation_bp.route('/accept-recommendation', methods=['POST'])
def accept_recommendation():
    """
    Mark recommendation as accepted/used by user
    
    Returns:
        JSON response confirming acceptance
    """
    try:
        # Get user email from request data or use default
        data = request.get_json() or {}
        user_email = data.get('email', request.args.get('email', 'test_user@example.com'))
        
        logger.info(f"Accepting recommendation for user: {user_email}")
        
        # Mark recommendation as used
        recommendation_agent.mark_recommendation_used(user_email)
        
        return jsonify({
            "success": True,
            "message": "Recommendation accepted"
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to accept recommendation: {str(e)}")
        return jsonify({"error": "Failed to process recommendation acceptance"}), 500

@recommendation_bp.route('/start-recommendation-service', methods=['POST'])
def start_recommendation_service():
    """
    Start the background recommendation service (Admin only)
    
    Returns:
        JSON response confirming service start
    """
    try:
        # Start the background service
        recommendation_agent.start_background_service()
        
        return jsonify({
            "success": True,
            "message": "Recommendation service started"
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to start recommendation service: {str(e)}")
        return jsonify({"error": "Failed to start recommendation service"}), 500

@recommendation_bp.route('/stop-recommendation-service', methods=['POST'])
def stop_recommendation_service():
    """
    Stop the background recommendation service (Admin only)
    
    Returns:
        JSON response confirming service stop
    """
    try:
        # Stop the background service
        recommendation_agent.stop_background_service()
        
        return jsonify({
            "success": True,
            "message": "Recommendation service stopped"
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to stop recommendation service: {str(e)}")
        return jsonify({"error": "Failed to stop recommendation service"}), 500

@recommendation_bp.route('/recommendation-status', methods=['GET'])
def get_recommendation_status():
    """
    Get status of recommendation service
    
    Returns:
        JSON response with service status
    """
    try:
        return jsonify({
            "service_running": recommendation_agent.running,
            "message": "Recommendation service is " + ("running" if recommendation_agent.running else "stopped")
        }), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to get recommendation status: {str(e)}")
        return jsonify({"error": "Failed to get service status"}), 500
