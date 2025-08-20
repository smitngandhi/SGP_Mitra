# SGP Mitra - API Documentation

## 🔗 Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## 🔐 Authentication

### JWT Token Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Lifecycle
- **Access Token**: Expires in 1 hour
- **Refresh Token**: Expires in 30 days
- **Auto-refresh**: Frontend handles token refresh automatically

## 📋 API Endpoints

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
    "message": "User registered successfully",
    "user_id": "64f8a1b2c3d4e5f6789012ab"
}
```

**Response (400 Bad Request):**
```json
{
    "error": "Email already exists"
}
```

---

### Login User
Authenticate user and receive JWT tokens.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Login successful",
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": "64f8a1b2c3d4e5f6789012ab",
        "username": "john_doe",
        "email": "john@example.com"
    }
}
```

**Response (401 Unauthorized):**
```json
{
    "error": "Invalid credentials"
}
```

---

### Google OAuth Login
Initiate Google OAuth authentication flow.

**Endpoint:** `GET /login/google`

**Response:** Redirects to Google OAuth consent screen

**Callback Endpoint:** `GET /callback`
Handles OAuth callback and creates user session.

---

### Forgot Password
Request password reset email.

**Endpoint:** `POST /forgot-password`

**Request Body:**
```json
{
    "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
    "message": "Password reset email sent"
}
```

---

### Reset Password
Reset password using token from email.

**Endpoint:** `POST /reset-password/<token>`

**Request Body:**
```json
{
    "new_password": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Password reset successful"
}
```

---

### Logout
Invalidate user session.

**Endpoint:** `POST /logout`
**Authentication:** Required

**Response (200 OK):**
```json
{
    "message": "Logged out successfully"
}
```

## Chatbot Endpoints

### Send Chat Message
Send message to AI chatbot and receive response.

**Endpoint:** `POST /api/chat`
**Authentication:** Required

**Request Body:**
```json
{
    "message": "I'm feeling anxious about my presentation tomorrow",
    "session_id": "optional_session_id"
}
```

**Response (200 OK):**
```json
{
    "response": "I understand that presentations can feel overwhelming. Let's work through this together. What specifically about the presentation is causing you the most anxiety?",
    "sentiment": {
        "compound": -0.3,
        "positive": 0.1,
        "negative": 0.4,
        "neutral": 0.5
    },
    "session_id": "64f8a1b2c3d4e5f6789012ab",
    "timestamp": "2024-01-15T10:30:00Z",
    "recommendations": [
        "Try deep breathing exercises",
        "Practice your presentation beforehand",
        "Visualize success"
    ]
}
```

---

### Voice Chat
Send audio message and receive text/audio response.

**Endpoint:** `POST /api/voice-chat`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request Body:**
```
audio: <audio_file.wav>
session_id: "optional_session_id"
```

**Response (200 OK):**
```json
{
    "transcription": "I'm feeling stressed about work",
    "response": "I hear that work stress can be really challenging. Would you like to talk about what's specifically causing you stress?",
    "audio_url": "/static/generated_audio/response_123.wav",
    "sentiment": {
        "compound": -0.2,
        "positive": 0.1,
        "negative": 0.3,
        "neutral": 0.6
    },
    "session_id": "64f8a1b2c3d4e5f6789012ab"
}
```

---

### Get Chat History
Retrieve user's conversation history.

**Endpoint:** `GET /api/chat-history`
**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)
- `session_id` (optional): Filter by specific session

**Response (200 OK):**
```json
{
    "chats": [
        {
            "id": "64f8a1b2c3d4e5f6789012ab",
            "message": "Hello Mitra",
            "response": "Hello! I'm here to support you. How are you feeling today?",
            "sentiment": {
                "compound": 0.5,
                "positive": 0.7,
                "negative": 0.0,
                "neutral": 0.3
            },
            "timestamp": "2024-01-15T10:30:00Z",
            "session_id": "session_123"
        }
    ],
    "total": 25,
    "has_more": true
}
```

---

### Generate Self-Care PDF
Generate personalized wellness report.

**Endpoint:** `POST /api/generate_selfcare_pdf`
**Authentication:** Required

**Request Body:**
```json
{
    "include_assessments": true,
    "include_chat_insights": true,
    "date_range": {
        "start": "2024-01-01",
        "end": "2024-01-31"
    }
}
```

**Response (200 OK):**
```json
{
    "pdf_url": "/static/reports/wellness_report_64f8a1b2c3d4e5f6789012ab.pdf",
    "generated_at": "2024-01-15T10:30:00Z",
    "insights": {
        "mood_trend": "improving",
        "most_discussed_topics": ["anxiety", "work stress", "sleep"],
        "recommended_activities": ["meditation", "exercise", "journaling"]
    }
}
```

## User Management Endpoints

### Get User Profile
Retrieve current user's profile information.

**Endpoint:** `GET /profile`
**Authentication:** Required

**Response (200 OK):**
```json
{
    "user": {
        "id": "64f8a1b2c3d4e5f6789012ab",
        "username": "john_doe",
        "email": "john@example.com",
        "created_at": "2024-01-01T00:00:00Z",
        "preferences": {
            "notification_frequency": "daily",
            "preferred_communication_style": "supportive",
            "crisis_contact": "+1234567890"
        },
        "stats": {
            "total_conversations": 45,
            "assessments_completed": 8,
            "days_active": 30
        }
    }
}
```

---

### Update User Profile
Update user profile information.

**Endpoint:** `PUT /profile`
**Authentication:** Required

**Request Body:**
```json
{
    "username": "john_doe_updated",
    "preferences": {
        "notification_frequency": "weekly",
        "preferred_communication_style": "direct",
        "crisis_contact": "+1234567890"
    }
}
```

**Response (200 OK):**
```json
{
    "message": "Profile updated successfully",
    "user": {
        "id": "64f8a1b2c3d4e5f6789012ab",
        "username": "john_doe_updated",
        "email": "john@example.com",
        "preferences": {
            "notification_frequency": "weekly",
            "preferred_communication_style": "direct",
            "crisis_contact": "+1234567890"
        }
    }
}
```

---

### Get Username
Retrieve current user's username.

**Endpoint:** `GET /get-username`
**Authentication:** Required

**Response (200 OK):**
```json
{
    "username": "john_doe"
}
```

---

### Update Chatbot Preferences
Update AI chatbot behavior preferences.

**Endpoint:** `POST /update-preferences`
**Authentication:** Required

**Request Body:**
```json
{
    "communication_style": "empathetic",
    "response_length": "medium",
    "topics_to_avoid": ["family", "relationships"],
    "preferred_activities": ["meditation", "breathing exercises"],
    "crisis_keywords": ["suicide", "self-harm", "hopeless"]
}
```

**Response (200 OK):**
```json
{
    "message": "Preferences updated successfully",
    "preferences": {
        "communication_style": "empathetic",
        "response_length": "medium",
        "topics_to_avoid": ["family", "relationships"],
        "preferred_activities": ["meditation", "breathing exercises"]
    }
}
```

## Assessment Endpoints

### Get Assessment Questions
Retrieve questions for mental health assessments.

**Endpoint:** `GET /test/questions`
**Authentication:** Required

**Query Parameters:**
- `test_type`: Type of assessment (phq9, gad7, wellness, custom)

**Response (200 OK):**
```json
{
    "test_type": "phq9",
    "title": "Patient Health Questionnaire-9",
    "description": "Depression screening questionnaire",
    "questions": [
        {
            "id": 1,
            "question": "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
            "type": "scale",
            "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]
        }
    ],
    "scoring": {
        "max_score": 27,
        "severity_levels": {
            "minimal": "0-4",
            "mild": "5-9",
            "moderate": "10-14",
            "moderately_severe": "15-19",
            "severe": "20-27"
        }
    }
}
```

---

### Submit Assessment
Submit assessment responses and receive results.

**Endpoint:** `POST /test/submit`
**Authentication:** Required

**Request Body:**
```json
{
    "test_type": "phq9",
    "responses": [
        {"question_id": 1, "answer": 2},
        {"question_id": 2, "answer": 1},
        {"question_id": 3, "answer": 3}
    ]
}
```

**Response (200 OK):**
```json
{
    "assessment_id": "64f8a1b2c3d4e5f6789012ab",
    "test_type": "phq9",
    "score": 15,
    "severity": "moderately_severe",
    "interpretation": "Your responses suggest moderate to severe depression symptoms. Consider speaking with a mental health professional.",
    "recommendations": [
        "Schedule appointment with therapist",
        "Practice daily mindfulness",
        "Maintain regular sleep schedule",
        "Engage in physical activity"
    ],
    "resources": [
        {
            "type": "hotline",
            "name": "National Suicide Prevention Lifeline",
            "contact": "988"
        }
    ],
    "completed_at": "2024-01-15T10:30:00Z"
}
```

---

### Get Assessment Results
Retrieve specific assessment results.

**Endpoint:** `GET /test/results/<assessment_id>`
**Authentication:** Required

**Response (200 OK):**
```json
{
    "assessment_id": "64f8a1b2c3d4e5f6789012ab",
    "test_type": "phq9",
    "score": 15,
    "severity": "moderately_severe",
    "completed_at": "2024-01-15T10:30:00Z",
    "responses": [
        {"question_id": 1, "answer": 2, "question": "Little interest or pleasure"},
        {"question_id": 2, "answer": 1, "question": "Feeling down or hopeless"}
    ],
    "recommendations": [
        "Schedule appointment with therapist",
        "Practice daily mindfulness"
    ]
}
```

---

### Get Assessment History
Retrieve user's assessment history and trends.

**Endpoint:** `GET /test/history`
**Authentication:** Required

**Query Parameters:**
- `test_type` (optional): Filter by assessment type
- `limit` (optional): Number of results (default: 20)

**Response (200 OK):**
```json
{
    "assessments": [
        {
            "assessment_id": "64f8a1b2c3d4e5f6789012ab",
            "test_type": "phq9",
            "score": 15,
            "severity": "moderately_severe",
            "completed_at": "2024-01-15T10:30:00Z"
        },
        {
            "assessment_id": "64f8a1b2c3d4e5f6789012ac",
            "test_type": "gad7",
            "score": 8,
            "severity": "mild",
            "completed_at": "2024-01-10T14:20:00Z"
        }
    ],
    "trends": {
        "phq9": {
            "current_score": 15,
            "previous_score": 18,
            "trend": "improving",
            "change": -3
        },
        "gad7": {
            "current_score": 8,
            "previous_score": 12,
            "trend": "improving",
            "change": -4
        }
    },
    "total": 12
}
```

## Emergency Support Endpoints

### Get Emergency Resources
Retrieve crisis intervention resources.

**Endpoint:** `GET /emergency/resources`
**Authentication:** Required

**Query Parameters:**
- `location` (optional): User's location for local resources

**Response (200 OK):**
```json
{
    "immediate_help": [
        {
            "name": "National Suicide Prevention Lifeline",
            "phone": "988",
            "available": "24/7",
            "description": "Free and confidential support"
        },
        {
            "name": "Crisis Text Line",
            "contact": "Text HOME to 741741",
            "available": "24/7",
            "description": "Text-based crisis support"
        }
    ],
    "local_resources": [
        {
            "name": "Local Mental Health Center",
            "phone": "+1234567890",
            "address": "123 Main St, City, State",
            "services": ["counseling", "emergency services"]
        }
    ],
    "safety_plan": {
        "warning_signs": ["feeling hopeless", "social isolation"],
        "coping_strategies": ["call friend", "practice breathing"],
        "support_contacts": ["emergency contact numbers"]
    }
}
```

---

### Report Crisis
Report a mental health crisis for immediate intervention.

**Endpoint:** `POST /emergency/crisis`
**Authentication:** Required

**Request Body:**
```json
{
    "severity": "high",
    "description": "User expressing suicidal thoughts",
    "immediate_danger": true,
    "location": "optional_location_info"
}
```

**Response (200 OK):**
```json
{
    "crisis_id": "64f8a1b2c3d4e5f6789012ab",
    "status": "escalated",
    "immediate_resources": [
        {
            "name": "Emergency Services",
            "contact": "911",
            "message": "Call immediately if in immediate danger"
        }
    ],
    "follow_up": {
        "scheduled": true,
        "contact_time": "2024-01-15T11:00:00Z"
    }
}
```

## Music Therapy Endpoints

### Generate Therapeutic Music
Generate AI-powered music based on mood and preferences.

**Endpoint:** `POST /music/generate`
**Authentication:** Required

**Request Body:**
```json
{
    "mood": "anxious",
    "preferred_genre": "ambient",
    "duration": 300,
    "intensity": "low",
    "purpose": "relaxation"
}
```

**Response (200 OK):**
```json
{
    "music_id": "64f8a1b2c3d4e5f6789012ab",
    "audio_url": "/static/generated_music/relaxation_123.wav",
    "metadata": {
        "duration": 300,
        "genre": "ambient",
        "mood": "calming",
        "bpm": 60,
        "key": "C major"
    },
    "therapeutic_properties": {
        "stress_reduction": 0.8,
        "mood_enhancement": 0.6,
        "focus_improvement": 0.4
    },
    "generated_at": "2024-01-15T10:30:00Z"
}
```

---

### Get Music Library
Retrieve user's saved therapeutic music.

**Endpoint:** `GET /music/library`
**Authentication:** Required

**Response (200 OK):**
```json
{
    "music_tracks": [
        {
            "music_id": "64f8a1b2c3d4e5f6789012ab",
            "title": "Calming Ambient #1",
            "audio_url": "/static/generated_music/relaxation_123.wav",
            "mood": "relaxation",
            "duration": 300,
            "created_at": "2024-01-15T10:30:00Z",
            "play_count": 5,
            "rating": 4.5
        }
    ],
    "total": 12,
    "favorites": 3
}
```

## Error Responses

### Standard Error Format
All error responses follow this format:

```json
{
    "error": "Error message description",
    "code": "ERROR_CODE",
    "details": "Additional error details (optional)",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Code Reference

| Error Code | Description |
|------------|-------------|
| `AUTH_REQUIRED` | Authentication token required |
| `INVALID_TOKEN` | JWT token is invalid or expired |
| `USER_NOT_FOUND` | User account not found |
| `INVALID_CREDENTIALS` | Login credentials are incorrect |
| `EMAIL_EXISTS` | Email already registered |
| `VALIDATION_ERROR` | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests in time window |
| `AI_SERVICE_UNAVAILABLE` | AI service temporarily unavailable |
| `ASSESSMENT_NOT_FOUND` | Assessment not found |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |

## Rate Limiting

### Rate Limits by Endpoint Type

| Endpoint Type | Rate Limit | Window |
|---------------|------------|---------|
| Authentication | 5 requests | 1 minute |
| Chat Messages | 30 requests | 1 minute |
| Voice Chat | 10 requests | 1 minute |
| Assessments | 5 requests | 1 hour |
| Profile Updates | 10 requests | 1 hour |
| Music Generation | 20 requests | 1 hour |

### Rate Limit Headers
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1642248000
```

## Webhooks

### Crisis Alert Webhook
Triggered when crisis is detected in user conversation.

**Payload:**
```json
{
    "event": "crisis_detected",
    "user_id": "64f8a1b2c3d4e5f6789012ab",
    "severity": "high",
    "message": "User message that triggered alert",
    "timestamp": "2024-01-15T10:30:00Z",
    "recommended_action": "immediate_intervention"
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class SGPMitraAPI {
    constructor(baseURL, token) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async sendMessage(message) {
        const response = await this.client.post('/api/chat', { message });
        return response.data;
    }

    async getProfile() {
        const response = await this.client.get('/profile');
        return response.data;
    }
}

// Usage
const api = new SGPMitraAPI('http://localhost:5000/api/v1', 'your_token');
const response = await api.sendMessage('Hello Mitra');
```

### Python
```python
import requests

class SGPMitraAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def send_message(self, message):
        response = requests.post(
            f'{self.base_url}/api/chat',
            json={'message': message},
            headers=self.headers
        )
        return response.json()
    
    def get_profile(self):
        response = requests.get(
            f'{self.base_url}/profile',
            headers=self.headers
        )
        return response.json()

# Usage
api = SGPMitraAPI('http://localhost:5000/api/v1', 'your_token')
response = api.send_message('Hello Mitra')
```

---

## 📞 Support

For API support and questions:
- **Email**: api-support@sgpmitra.com
- **Documentation**: https://docs.sgpmitra.com
- **Status Page**: https://status.sgpmitra.com
