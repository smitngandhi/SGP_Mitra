# 🤖 Smart User Recommendation Agent

## Overview

The Smart User Recommendation Agent is an intelligent background service for the Mitra Platform that analyzes user behavior patterns and provides personalized, contextually-aware recommendations to enhance user experience and platform utilization.

## 🎯 Key Features

### Automated Data Analysis
- **Frequency**: Analyzes user tracking data every 5 minutes
- **Data Source**: MongoDB tracking_collection with structured user visit patterns
- **Intelligence**: Identifies behavioral patterns and engagement metrics

### Intelligent Recommendation Generation
- **LLM-Powered**: Uses integrated LLM capabilities for contextual recommendations
- **Personalized**: Based on historical usage patterns and time-spent analysis
- **Contextual**: Provides relevant API documentation suggestions

### Seamless User Interaction
- **Frontend Integration**: Automatic popup notifications
- **Navigation Automation**: Auto-navigation with input field focus
- **User Consent**: Respects user choice with "Accept" or "Dismiss" options

### Continuous Learning
- **Adaptive**: Evolves recommendations based on changing user behavior
- **Tie-Breaking**: Intelligent randomization for equal engagement scenarios
- **Exclusion Logic**: Filters out login/register pages from recommendations

## 🏗️ Architecture

### Backend Components

#### 1. Recommendation Agent (`app/services/recommendation_agent.py`)
- **UserRecommendationAgent**: Main service class
- **Background Scheduler**: Runs analysis every 5 minutes using `schedule` library
- **Data Analysis**: Calculates page engagement metrics
- **LLM Integration**: Generates intelligent recommendations

#### 2. API Routes (`app/routes/recommendation_routes.py`)
- `GET /get-recommendation`: Retrieve user recommendations
- `POST /accept-recommendation`: Mark recommendations as used
- `POST /start-recommendation-service`: Admin service control
- `POST /stop-recommendation-service`: Admin service control
- `GET /recommendation-status`: Service status monitoring

#### 3. Service Manager (`app/services/service_manager.py`)
- **Initialization**: Auto-starts services with Flask app
- **Cleanup**: Graceful shutdown handling
- **Error Management**: Robust error handling and logging

### Frontend Components

#### 1. Recommendation Popup (`frontend/src/components/RecommendationPopup.jsx`)
- **Automatic Detection**: Checks for recommendations every 30 seconds
- **Beautiful UI**: Gradient design with smooth animations
- **Navigation Automation**: Auto-navigation with input focus
- **Responsive Design**: Mobile-friendly interface

#### 2. CSS Styling (`frontend/src/components/RecommendationPopup.css`)
- **Modern Design**: Gradient backgrounds and smooth transitions
- **Accessibility**: High contrast and readable fonts
- **Mobile Responsive**: Adapts to different screen sizes

## 📊 Data Structure

### User Tracking Data Format
```json
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
```

### Recommendation Data Format
```json
{
  "email": "user@example.com",
  "recommended_page": "/assessment",
  "page_display_name": "Know Your Mind",
  "frontend_url": "http://localhost:3000/assessment",
  "recommendation_data": {
    "message": "Based on your usage patterns, we recommend revisiting Know Your Mind",
    "features": "PHQ-9, GAD-7 assessments, mental health scoring, progress tracking",
    "reasoning": "You've spent significant time here before"
  },
  "generated_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-16T10:30:00Z"
}
```

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
pip install schedule
```

### 2. Environment Variables
Add to your `.env` file:
```env
TRACKING_COLLECTION=tracking
TOGETHER_API_KEY=your_together_ai_key
```

### 3. Database Collections
The system uses these MongoDB collections:
- `tracking`: User behavior data
- `recommendations`: Generated recommendations

### 4. Frontend Integration
The RecommendationPopup component is automatically integrated into App.jsx for authenticated users.

## 🔧 Configuration

### Page Mapping
The system maps frontend routes to user-friendly names:

| Frontend Route | Display Name | API Features |
|---------------|--------------|--------------|
| `/assessment` | Know Your Mind | PHQ-9, GAD-7 assessments |
| `/chat-bot` | MindChat | AI conversations, voice chat |
| `/music_generation` | ZenBeats | AI music generation |
| `/selfcare` | SelfCare | Wellness reports, insights |
| `/emergency` | Emergency Help | Crisis resources |
| `/profile` | User Profile | Account management |

### Recommendation Logic
1. **First-time Users**: No recommendations (insufficient data)
2. **Returning Users**: Analyze all historical sessions
3. **Recommendation Basis**: Page with highest total time spent
4. **Tie-breaking**: Random selection with reasoning
5. **Exclusions**: Login, register, logout pages filtered out

## 🧪 Testing

### Run Test Suite
```bash
python test_recommendation_system.py
```

### Test Coverage
- ✅ Time string parsing (`"45.5 seconds"` → `45.5`)
- ✅ Page time calculation (aggregates across sessions)
- ✅ Recommendation generation (LLM integration)
- ✅ API endpoint functionality
- ✅ Data cleanup and validation

### Sample Test Output
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

## 📈 Performance Metrics

### Success Criteria
- **Response Time**: < 30 seconds for analysis and generation
- **Accuracy**: Recommendations reflect genuine user interests
- **Relevance**: API documentation matches recommended pages
- **Engagement**: Users accept recommendations and explore features
- **Reliability**: Handles edge cases without system failures

### Monitoring
- **Service Status**: `/recommendation-status` endpoint
- **Error Logging**: Comprehensive logging with app.utils.logger_utils
- **Database Efficiency**: Optimized queries with connection pooling

## 🛡️ Error Handling

### Graceful Degradation
- **No Historical Data**: "Getting to know your preferences. Keep exploring!"
- **Equal Time Distribution**: Intelligent randomization with reasoning
- **LLM Failure**: "We're experiencing technical difficulties. Please explore manually."
- **Database Issues**: "Connection issues detected. Recommendations temporarily unavailable."

### Logging Levels
- **DEBUG**: Detailed analysis steps
- **INFO**: Service status and recommendations generated
- **WARNING**: Non-critical issues (duplicate starts, etc.)
- **ERROR**: Critical failures with full stack traces

## 🔄 API Endpoints

### User Endpoints
- `GET /api/v1/get-recommendation` - Get personalized recommendation
- `POST /api/v1/accept-recommendation` - Mark recommendation as used

### Admin Endpoints  
- `POST /api/v1/start-recommendation-service` - Start background service
- `POST /api/v1/stop-recommendation-service` - Stop background service
- `GET /api/v1/recommendation-status` - Check service status

## 🎨 Frontend Integration

### Automatic Integration
The RecommendationPopup component is automatically included in App.jsx:

```jsx
{isLoggedIn && <RecommendationPopup />}
```

### User Experience Flow
1. **Background Analysis**: Service analyzes user behavior every 5 minutes
2. **Recommendation Generation**: LLM creates personalized suggestions
3. **Popup Display**: Beautiful popup appears with recommendation
4. **User Choice**: "Take me there!" or "Maybe later" options
5. **Navigation**: Automatic navigation with input field focus
6. **Cleanup**: Recommendation marked as used and removed

## 🔮 Future Enhancements

### Phase 2 Features
- **Weighted Scoring**: Consider both frequency and duration
- **Advanced Tie-Breaking**: Beyond random selection
- **A/B Testing**: Multiple recommendation algorithms
- **User Preferences**: Learning from dismissal patterns

### Phase 3 Features
- **Cross-Session Analysis**: Multi-device behavior tracking
- **Collaborative Filtering**: Recommendations based on similar users
- **Predictive Analytics**: Anticipate user needs before they arise
- **Integration Webhooks**: Third-party service notifications

## 📞 Support & Troubleshooting

### Common Issues

**Service Not Starting**
```bash
# Check logs for initialization errors
tail -f app.log | grep "recommendation"
```

**No Recommendations Generated**
- Verify user has sufficient historical data (multiple sessions)
- Check LLM API key configuration
- Ensure tracking_collection has valid data

**Frontend Popup Not Appearing**
- Verify user is authenticated
- Check browser console for JavaScript errors
- Confirm API endpoints are accessible

### Debug Mode
Enable detailed logging by setting log level to DEBUG in your configuration.

---

**Built with ❤️ for the Mitra Mental Health Platform**

*Enhancing user experience through intelligent behavioral analysis and personalized recommendations.*
