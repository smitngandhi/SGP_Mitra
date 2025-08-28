"""
Create test data for recommendation system debugging
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app.models import client
import json

# Get database collections
db = client['mitra_db']
tracking_collection = db['tracking']
recommendations_collection = db['recommendations']

def create_test_data():
    """Create test user data with recommendations"""
    
    # Test user data
    test_email = "22ce031@charusat.edu.in"
    
    # Clear existing data
    tracking_collection.delete_many({"email": test_email})
    recommendations_collection.delete_many({"email": test_email})
    
    # Create tracking data
    tracking_data = {
        "email": test_email,
        "user_visits": [
            {
                "count": 3,
                "visits": [
                    {
                        "page": "/assessment",
                        "timeSpent": "45.5 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat() + 'Z'
                    },
                    {
                        "page": "/chat-bot",
                        "timeSpent": "120.3 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat() + 'Z'
                    },
                    {
                        "page": "/music_generation",
                        "timeSpent": "89.7 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(minutes=30)).isoformat() + 'Z'
                    }
                ]
            }
        ]
    }
    
    # Insert tracking data
    tracking_collection.insert_one(tracking_data)
    print(f"✅ Created tracking data for {test_email}")
    
    # Create recommendation data
    recommendation_data = {
        "email": test_email,
        "recommended_page": "/chat-bot",
        "page_display_name": "MindChat",
        "frontend_url": "http://localhost:3000/chat-bot",
        "recommendation_data": {
            "message": "Based on your usage patterns, we recommend exploring MindChat for deeper conversations",
            "features": "AI conversations, voice chat, personalized responses, mental health support",
            "reasoning": "You've spent significant time here before and showed high engagement"
        },
        "generated_at": datetime.utcnow().isoformat() + 'Z',
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat() + 'Z',
        "notification_type": "chatbot"
    }
    
    # Insert recommendation
    recommendations_collection.insert_one(recommendation_data)
    print(f"✅ Created recommendation for {test_email}")
    
    print("\n📊 Test Data Summary:")
    print(f"User: {test_email}")
    print(f"Pages visited: {len(tracking_data['user_visits'][0]['visits'])}")
    print(f"Recommended page: {recommendation_data['recommended_page']}")
    print(f"Recommendation expires: {recommendation_data['expires_at']}")

def verify_data():
    """Verify test data exists"""
    test_email = "22ce031@charusat.edu.in"
    
    # Check tracking data
    tracking = tracking_collection.find_one({"email": test_email})
    if tracking:
        print(f"✅ Tracking data found for {test_email}")
        print(f"   Pages: {len(tracking['user_visits'][0]['visits'])}")
    else:
        print(f"❌ No tracking data found for {test_email}")
    
    # Check recommendation data
    recommendation = recommendations_collection.find_one({"email": test_email})
    if recommendation:
        print(f"✅ Recommendation found for {test_email}")
        print(f"   Page: {recommendation['recommended_page']}")
        print(f"   Display: {recommendation['page_display_name']}")
    else:
        print(f"❌ No recommendation found for {test_email}")

if __name__ == "__main__":
    print("🔧 Creating test data for recommendation system...")
    create_test_data()
    print("\n🔍 Verifying test data...")
    verify_data()
    print("\n🎯 Test data creation complete!")
