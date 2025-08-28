from flask import Blueprint, request, jsonify
from app.models import client
from app.utils.logger_utils import get_logger
import os
from datetime import datetime

tracking_bp = Blueprint('tracking', __name__)
logger = get_logger(__name__)

# Get database collections
db = client[os.getenv('MONGO_DB_NAME', 'mitra_db')]
tracking_collection = db[os.getenv('TRACKING_COLLECTION', 'tracking')]

@tracking_bp.route('/sync-tracking-data', methods=['POST'])
def sync_tracking_data():
    """
    Sync localStorage pageTracking data with MongoDB tracking collection
    Combines existing tracking data with new localStorage data
    """
    try:
        data = request.get_json()
        current_user = data.get('userEmail', 'test_user@example.com') if data else 'test_user@example.com'
        print(current_user)
        if not data or 'pageTracking' not in data:
            return jsonify({
                'success': False,
                'message': 'No pageTracking data provided'
            }), 400
        
        page_tracking = data['pageTracking']
        print(page_tracking)
        # Get existing tracking data from MongoDB
        existing_data = tracking_collection.find_one({'email': current_user})
        
        if existing_data:
            # Merge localStorage data with existing MongoDB data
            existing_visits = existing_data.get('user_visits', [])
            
            # Convert localStorage format to MongoDB format
            for page_url, tracking_info in page_tracking.items():
                if isinstance(tracking_info, dict) and 'totalTime' in tracking_info:
                    # Find if this page already exists in MongoDB data
                    page_found = False
                    for visit_group in existing_visits:
                        if any(visit['page'] == page_url for visit in visit_group.get('visits', [])):
                            # Add new visit to existing page group
                            visit_group['visits'].append({
                                'page': page_url,
                                'timeSpent': f"{tracking_info['totalTime']} seconds",
                                'timestamp': datetime.utcnow().isoformat() + 'Z'
                            })
                            visit_group['count'] += 1
                            page_found = True
                            break
                    
                    if not page_found:
                        # Create new visit group for this page
                        existing_visits.append({
                            'count': 1,
                            'visits': [{
                                'page': page_url,
                                'timeSpent': f"{tracking_info['totalTime']} seconds",
                                'timestamp': datetime.utcnow().isoformat() + 'Z'
                            }]
                        })
            
            # Update the document
            tracking_collection.update_one(
                {'email': current_user},
                {'$set': {'user_visits': existing_visits}}
            )
        else:
            # Create new tracking document
            user_visits = []
            for page_url, tracking_info in page_tracking.items():
                if isinstance(tracking_info, dict) and 'totalTime' in tracking_info:
                    user_visits.append({
                        'count': 1,
                        'visits': [{
                            'page': page_url,
                            'timeSpent': f"{tracking_info['totalTime']} seconds",
                            'timestamp': datetime.utcnow().isoformat() + 'Z'
                        }]
                    })
            
            tracking_collection.insert_one({
                'email': current_user,
                'user_visits': user_visits
            })
        
        logger.info(f"Successfully synced tracking data for user: {current_user}")
        
        return jsonify({
            'success': True,
            'message': 'Tracking data synced successfully',
            'pages_synced': len(page_tracking)
        })
        
    except Exception as e:
        logger.error(f"Error syncing tracking data: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to sync tracking data'
        }), 500

@tracking_bp.route('/get-combined-tracking', methods=['GET'])
def get_combined_tracking():
    """
    Get combined tracking data from both MongoDB and localStorage
    Returns formatted data for recommendation analysis
    """
    try:
        current_user = request.args.get('email', 'test_user@example.com')
        
        # Get MongoDB tracking data
        mongodb_data = tracking_collection.find_one({'email': current_user})
        
        combined_data = {
            'email': current_user,
            'mongodb_visits': mongodb_data.get('user_visits', []) if mongodb_data else [],
            'total_pages_tracked': 0,
            'last_updated': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Calculate total pages tracked
        if mongodb_data:
            combined_data['total_pages_tracked'] = len(mongodb_data.get('user_visits', []))
        
        return jsonify({
            'success': True,
            'data': combined_data
        })
        
    except Exception as e:
        logger.error(f"Error getting combined tracking data: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get tracking data'
        }), 500
