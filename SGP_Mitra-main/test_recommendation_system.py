"""
Test script for Smart User Recommendation Agent
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app.services.recommendation_agent import recommendation_agent
from app.models import tracking_collection
import json

def create_test_user_data():
    """Create test user data for recommendation testing"""
    test_email = "test_user@example.com"
    
    # Sample user tracking data
    test_data = {
        "email": test_email,
        "user_visits": [
            {
                "count": 1,
                "visits": [
                    {
                        "page": "/assessment",
                        "timeSpent": "45.5 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat()
                    },
                    {
                        "page": "/chat-bot",
                        "timeSpent": "120.3 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat()
                    },
                    {
                        "page": "/music_generation",
                        "timeSpent": "30.2 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat()
                    }
                ]
            },
            {
                "count": 2,
                "visits": [
                    {
                        "page": "/assessment",
                        "timeSpent": "67.8 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat()
                    },
                    {
                        "page": "/selfcare",
                        "timeSpent": "89.1 seconds",
                        "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat()
                    }
                ]
            }
        ]
    }
    
    # Insert test data
    tracking_collection.update_one(
        {"email": test_email},
        {"$set": test_data},
        upsert=True
    )
    
    print(f"✅ Created test data for user: {test_email}")
    return test_email

def test_recommendation_generation():
    """Test the recommendation generation process"""
    print("\n🧪 Testing Recommendation Generation")
    print("=" * 50)
    
    # Create test user
    test_email = create_test_user_data()
    
    # Get user data
    user_data = tracking_collection.find_one({"email": test_email})
    
    if not user_data:
        print("❌ Failed to create test user data")
        return False
    
    # Analyze user behavior
    recommendation = recommendation_agent.generate_recommendation_for_user(user_data)
    
    if recommendation:
        print("✅ Recommendation generated successfully!")
        print(f"📧 User: {recommendation['email']}")
        print(f"📄 Recommended Page: {recommendation['recommended_page']}")
        print(f"🎯 Display Name: {recommendation['page_display_name']}")
        print(f"🔗 Frontend URL: {recommendation['frontend_url']}")
        print(f"💬 Message: {recommendation['recommendation_data']['message']}")
        print(f"⚡ Features: {recommendation['recommendation_data']['features']}")
        print(f"🤔 Reasoning: {recommendation['recommendation_data']['reasoning']}")
        return True
    else:
        print("❌ Failed to generate recommendation")
        return False

def test_page_time_calculation():
    """Test page time calculation logic"""
    print("\n⏱️ Testing Page Time Calculation")
    print("=" * 50)
    
    test_visits = [
        {
            "count": 1,
            "visits": [
                {"page": "/assessment", "timeSpent": "45.5 seconds"},
                {"page": "/chat-bot", "timeSpent": "120.3 seconds"},
                {"page": "/assessment", "timeSpent": "30.2 seconds"}
            ]
        }
    ]
    
    page_times = recommendation_agent._calculate_page_time_spent(test_visits)
    
    print("📊 Page Time Analysis:")
    for page, time_spent in page_times.items():
        print(f"  {page}: {time_spent:.1f} seconds")
    
    # Verify calculations
    expected_assessment_time = 45.5 + 30.2  # 75.7 seconds
    actual_assessment_time = page_times.get('/assessment', 0)
    
    if abs(actual_assessment_time - expected_assessment_time) < 0.1:
        print("✅ Page time calculation is correct")
        return True
    else:
        print(f"❌ Page time calculation error: expected {expected_assessment_time}, got {actual_assessment_time}")
        return False

def test_time_string_parsing():
    """Test time string parsing functionality"""
    print("\n🔤 Testing Time String Parsing")
    print("=" * 50)
    
    test_cases = [
        ("45.5 seconds", 45.5),
        ("2.3 minutes", 138.0),  # 2.3 * 60
        ("1.5 hours", 5400.0),   # 1.5 * 3600
        ("invalid time", 0.0)
    ]
    
    all_passed = True
    
    for time_str, expected in test_cases:
        result = recommendation_agent._parse_time_string(time_str)
        if abs(result - expected) < 0.1:
            print(f"✅ '{time_str}' → {result} seconds")
        else:
            print(f"❌ '{time_str}' → {result} seconds (expected {expected})")
            all_passed = False
    
    return all_passed

def test_api_endpoints():
    """Test API endpoint functionality"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 50)
    
    test_email = "test_user@example.com"
    
    # Test getting recommendation
    recommendation = recommendation_agent.get_user_recommendation(test_email)
    
    if recommendation:
        print("✅ get_user_recommendation works")
        print(f"📄 Found recommendation for: {recommendation.get('page_display_name', 'Unknown')}")
        
        # Test marking as used
        recommendation_agent.mark_recommendation_used(test_email)
        print("✅ mark_recommendation_used works")
        
        # Verify it's removed
        after_use = recommendation_agent.get_user_recommendation(test_email)
        if not after_use:
            print("✅ Recommendation properly removed after use")
            return True
        else:
            print("❌ Recommendation not removed after use")
            return False
    else:
        print("ℹ️ No recommendation found (this is normal for new users)")
        return True

def cleanup_test_data():
    """Clean up test data"""
    print("\n🧹 Cleaning up test data...")
    
    # Remove test user data
    tracking_collection.delete_many({"email": "test_user@example.com"})
    
    # Remove test recommendations
    recommendations_collection = tracking_collection.database['recommendations']
    recommendations_collection.delete_many({"email": "test_user@example.com"})
    
    print("✅ Test data cleaned up")

def main():
    """Run all tests"""
    print("🚀 Smart User Recommendation Agent - Test Suite")
    print("=" * 60)
    
    tests = [
        ("Time String Parsing", test_time_string_parsing),
        ("Page Time Calculation", test_page_time_calculation),
        ("Recommendation Generation", test_recommendation_generation),
        ("API Endpoints", test_api_endpoints)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {str(e)}")
            results.append((test_name, False))
    
    # Cleanup
    cleanup_test_data()
    
    # Summary
    print("\n📊 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Recommendation system is ready.")
    else:
        print("⚠️ Some tests failed. Please review the implementation.")

if __name__ == "__main__":
    main()
