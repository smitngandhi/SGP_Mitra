# 🚀 Smart User Recommendation Agent - Deployment Guide

## Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **MongoDB**: 4.4 or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: 500MB free space

### API Keys Required
- **Together.AI API Key**: For LLM-powered recommendations
- **MongoDB Connection String**: For data storage and retrieval

## 📋 Step-by-Step Deployment

### 1. Environment Setup

#### Backend Configuration
Update your `.env` file with the following variables:

```env
# Recommendation System Configuration
TOGETHER_API_KEY=your_together_ai_api_key_here
RECOMMENDATION_ANALYSIS_INTERVAL=5
TRACKING_COLLECTION=tracking

# Existing MongoDB Collections
USERS_COLLECTION=users
CHATS_COLLECTION=chats
```

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

The following packages are required for the recommendation system:
- `schedule` - Background task scheduling
- `pymongo` - MongoDB integration
- `flask` - API endpoints
- `together` - LLM integration

### 2. Database Setup

#### MongoDB Collections
Ensure these collections exist in your MongoDB database:

```javascript
// tracking - User behavior data
{
  "email": "user@example.com",
  "user_visits": [
    {
      "count": 1,
      "visits": [
        {
          "page": "/assessment",
          "timeSpent": "45.30 seconds",
          "timestamp": "2025-08-28T08:46:38.435Z"
        }
      ]
    }
  ]
}

// recommendations - Generated recommendations
{
  "email": "user@example.com",
  "recommended_page": "/assessment",
  "page_display_name": "Know Your Mind",
  "frontend_url": "http://localhost:3000/assessment",
  "recommendation_data": {
    "message": "Based on your usage patterns...",
    "features": "PHQ-9, GAD-7 assessments...",
    "reasoning": "You've spent significant time here before"
  },
  "generated_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-16T10:30:00Z"
}
```

### 3. Backend Deployment

#### File Structure Verification
Ensure these files are in place:

```
app/
├── services/
│   ├── recommendation_agent.py     ✅ Smart recommendation logic
│   └── service_manager.py          ✅ Background service management
├── routes/
│   └── recommendation_routes.py    ✅ API endpoints
└── __init__.py                     ✅ Flask app integration
```

#### Start Backend Server
```bash
# Development
python app.py

# Production (with gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Verify Backend Services
Check that the recommendation service starts automatically:

```bash
curl http://localhost:5000/api/v1/recommendation-status
```

Expected response:
```json
{
  "service_running": true,
  "message": "Recommendation service is running and analyzing user behavior every 5 minutes"
}
```

### 4. Frontend Deployment

#### Install Node.js Dependencies
```bash
cd frontend
npm install
```

#### File Structure Verification
Ensure these files are in place:

```
frontend/src/components/
├── RecommendationPopup.jsx         ✅ User-facing popup
├── RecommendationPopup.css         ✅ Popup styling
├── AdminRecommendationPanel.jsx    ✅ Admin dashboard
└── AdminRecommendationPanel.css    ✅ Admin styling
```

#### Integration Verification
Check that `App.jsx` includes the recommendation popup:

```jsx
// Should be present in App.jsx
import RecommendationPopup from './components/RecommendationPopup';

// Inside the component return
{isLoggedIn && <RecommendationPopup />}
```

#### Start Frontend Server
```bash
# Development
npm start

# Production build
npm run build
```

### 5. Testing Deployment

#### Run Test Suite
```bash
python test_recommendation_system.py
```

Expected output:
```
🚀 Smart User Recommendation Agent - Test Suite
============================================================
✅ PASS Time String Parsing
✅ PASS Page Time Calculation  
✅ PASS Recommendation Generation
✅ PASS API Endpoints

🎯 Overall: 4/4 tests passed
🎉 All tests passed! Recommendation system is ready.
```

#### Manual Testing Checklist

**Backend API Tests:**
- [ ] `GET /api/v1/recommendation-status` returns service status
- [ ] `GET /api/v1/get-recommendation` returns recommendations for users with data
- [ ] `POST /api/v1/accept-recommendation` marks recommendations as used
- [ ] `POST /api/v1/start-recommendation-service` starts the service
- [ ] `POST /api/v1/stop-recommendation-service` stops the service

**Frontend Integration Tests:**
- [ ] Recommendation popup appears for logged-in users with recommendations
- [ ] "Take me there!" button navigates to recommended page
- [ ] "Maybe later" button dismisses the popup
- [ ] Admin panel shows correct service status
- [ ] Admin controls start/stop service successfully

**End-to-End User Flow:**
1. [ ] User logs in and visits multiple pages
2. [ ] User spends time on different pages (tracked in MongoDB)
3. [ ] Background service analyzes behavior (every 5 minutes)
4. [ ] Recommendation popup appears with personalized suggestion
5. [ ] User accepts recommendation and is navigated to suggested page
6. [ ] Input fields are automatically focused after navigation

### 6. Production Configuration

#### Environment Variables for Production
```env
# Production URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# Security
FLASK_ENV=production
SECRET_KEY=your-secure-secret-key

# Performance
RECOMMENDATION_ANALYSIS_INTERVAL=5
MAX_RECOMMENDATIONS_PER_USER=3
RECOMMENDATION_EXPIRY_HOURS=24
```

#### Performance Optimization
```python
# In recommendation_agent.py, consider these optimizations:

# 1. Database connection pooling
client = MongoClient(connection_string, maxPoolSize=50)

# 2. Batch processing for multiple users
def analyze_all_users_batch(batch_size=100):
    # Process users in batches to reduce memory usage
    
# 3. Caching frequently accessed data
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_page_mapping():
    # Cache page mappings to reduce computation
```

#### Monitoring and Logging
```python
# Enhanced logging configuration
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('recommendation_agent.log'),
        logging.StreamHandler()
    ]
)
```

### 7. Troubleshooting

#### Common Issues and Solutions

**Service Not Starting**
```bash
# Check logs
tail -f app.log | grep "recommendation"

# Verify environment variables
python -c "import os; print(os.getenv('TOGETHER_API_KEY'))"

# Test MongoDB connection
python -c "from app.models import client; print(client.server_info())"
```

**No Recommendations Generated**
- Verify users have sufficient tracking data (multiple page visits)
- Check Together.AI API key is valid and has credits
- Ensure tracking_collection contains valid time data
- Verify LLM service is responding

**Frontend Popup Not Appearing**
- Check browser console for JavaScript errors
- Verify user authentication status
- Confirm API endpoints are accessible
- Check CORS configuration for cross-origin requests

**Performance Issues**
- Monitor MongoDB query performance
- Check memory usage during analysis
- Consider reducing analysis frequency
- Implement database indexing on email and timestamp fields

#### Health Check Endpoints
```bash
# Service health
curl http://localhost:5000/api/v1/recommendation-status

# Database connectivity
curl http://localhost:5000/api/v1/health

# LLM service availability
curl http://localhost:5000/api/v1/llm-health
```

### 8. Scaling Considerations

#### Horizontal Scaling
- Use Redis for shared session storage
- Implement message queues for background processing
- Consider microservices architecture for recommendation engine

#### Database Optimization
```javascript
// MongoDB indexes for better performance
db.tracking.createIndex({ "email": 1, "user_visits.visits.timestamp": -1 })
db.recommendations.createIndex({ "email": 1, "expires_at": 1 })
```

#### Load Balancing
```nginx
# Nginx configuration for load balancing
upstream backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://backend;
    }
}
```

## 🔒 Security Considerations

### API Security
- Implement rate limiting on recommendation endpoints
- Validate all user inputs and sanitize data
- Use HTTPS in production
- Implement proper authentication and authorization

### Data Privacy
- Anonymize user behavior data where possible
- Implement data retention policies
- Ensure GDPR compliance for user tracking
- Provide opt-out mechanisms for users

### Environment Security
```env
# Use strong, unique secrets
SECRET_KEY=generate-a-strong-random-key
TOGETHER_API_KEY=keep-this-secret-and-rotate-regularly

# Database security
MONGODB_URI=mongodb://username:password@host:port/database?ssl=true
```

## 📊 Monitoring and Analytics

### Key Metrics to Track
- **Recommendation Acceptance Rate**: % of users who accept recommendations
- **Service Uptime**: Background service availability
- **Response Time**: API endpoint performance
- **User Engagement**: Time spent on recommended pages
- **Error Rate**: Failed recommendation generations

### Logging Strategy
```python
# Structured logging for better monitoring
import structlog

logger = structlog.get_logger()

# Log recommendation events
logger.info("recommendation_generated", 
           user_email=email, 
           recommended_page=page,
           analysis_duration=duration)
```

## 🎯 Success Criteria

### Deployment Success Indicators
- [ ] All tests pass without errors
- [ ] Background service runs continuously
- [ ] API endpoints respond within 2 seconds
- [ ] Frontend popup displays correctly
- [ ] User navigation works seamlessly
- [ ] Admin panel controls function properly

### Performance Benchmarks
- **Analysis Speed**: < 30 seconds per user
- **API Response Time**: < 500ms average
- **Memory Usage**: < 512MB per worker
- **Database Queries**: < 100ms average
- **User Acceptance Rate**: > 25% target

---

**🎉 Congratulations!** Your Smart User Recommendation Agent is now deployed and ready to enhance user experience through intelligent behavioral analysis and personalized recommendations.

For support or questions, refer to the comprehensive README or check the troubleshooting section above.
