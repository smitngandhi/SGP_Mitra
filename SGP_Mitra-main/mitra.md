#  Mitra - Complete Platform Guide

## What is Mitra?

** Mitra** is an advanced AI-powered mental wellness assistant designed to provide accessible, immediate, and personalized mental health support. Named after the Sanskrit word for "friend," Mitra serves as a compassionate digital companion that combines cutting-edge artificial intelligence with evidence-based therapeutic approaches.

### Mission & Purpose
- **Accessibility**: Make mental health support available 24/7 to everyone, regardless of location or economic status
- **Immediate Support**: Provide instant crisis intervention and emotional support when needed most
- **Personalization**: Deliver tailored therapeutic recommendations based on individual needs and preferences
- **Bridge Building**: Connect daily mental wellness practices with professional therapeutic care
- **Safe Space**: Create a judgment-free environment for emotional expression and healing

### Core Philosophy
Mitra operates on the principle that mental wellness is a fundamental human right. By leveraging AI technology, the platform democratizes access to mental health resources while maintaining the highest standards of privacy, security, and clinical effectiveness.

---

## Platform Features

### 1. AI-Powered Chatbot
- **Natural Language Processing**: Advanced conversational AI using Together.AI LLM
- **Contextual Understanding**: Maintains conversation history and context across sessions
- **Emotional Intelligence**: VADER sentiment analysis for real-time mood detection
- **Therapeutic Responses**: Evidence-based therapeutic techniques integrated into conversations
- **Crisis Detection**: Automatic identification of crisis situations with appropriate interventions
- **Personalized Conversations**: Adapts responses based on user preferences and interaction history

### 2. Voice Interaction System
- **Speech-to-Text**: OpenAI Whisper integration for accurate voice recognition
- **Text-to-Speech**: ElevenLabs synthesis for natural, human-like voice responses
- **Hands-Free Operation**: Complete voice-based interaction capability
- **Accessibility Support**: Designed for users with visual impairments or reading difficulties
- **Multi-Language Support**: Voice interaction in multiple languages

### 3. Mental Health Assessments
- **PHQ-9 Depression Scale**: Standardized depression screening questionnaire (9 questions)
- **GAD-7 Anxiety Scale**: Validated anxiety assessment tool (7 questions)
- **Custom Assessments**: Tailored questionnaires based on specific user needs
- **Progress Tracking**: Historical assessment data with trend analysis and visualization
- **Clinical Integration**: Results formatted for easy sharing with healthcare providers
- **Automated Scoring**: Instant results with severity levels and recommendations

### 4. AI-Generated Music Therapy
- **Personalized Compositions**: AI-generated music based on current mood and preferences
- **Therapeutic Frequencies**: Scientifically-backed sound therapy integration
- **Mood-Based Selection**: Music recommendations aligned with emotional state
- **Binaural Beats**: Specialized audio for relaxation, focus enhancement, and sleep
- **Downloadable Content**: Save and replay favorite therapeutic tracks
- **Custom Playlists**: Create personalized therapeutic music collections

### 5. Self-Care Activities & Tools
- **Guided Meditations**: Step-by-step mindfulness exercises with audio guidance
- **Breathing Exercises**: Various breathing techniques for anxiety, stress, and relaxation
- **Journaling Prompts**: Structured writing exercises for emotional processing and reflection
- **Progressive Muscle Relaxation**: Physical tension release techniques with guided instructions
- **Cognitive Behavioral Exercises**: CBT-based thought challenging and reframing activities
- **Daily Wellness Check-ins**: Quick mood and energy level tracking

### 6. Emergency Crisis Support
- **24/7 Availability**: Round-the-clock crisis intervention capability
- **Immediate Response**: Instant crisis detection and response protocols
- **Resource Directory**: Comprehensive list of emergency mental health resources
- **Location-Based Services**: Local crisis center and hotline information
- **Safety Planning**: Collaborative safety plan creation and management
- **Emergency Contacts**: Quick access to crisis hotlines and emergency services

### 7. Progress Tracking & Analytics
- **Mood Journaling**: Daily mood tracking with visual analytics and trends
- **Assessment History**: Longitudinal view of mental health assessments over time
- **Activity Completion**: Track engagement with self-care activities and exercises
- **Goal Setting**: Personal wellness goals with progress monitoring and reminders
- **Wellness Reports**: Comprehensive PDF reports for personal use or healthcare providers
- **Data Visualization**: Interactive charts showing mood patterns and improvement trends

---

## Technical Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External APIs │
│   (React 19)    │◄──►│   (Flask)       │◄──►│   (AI Services) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Device   │    │    Database     │    │   File Storage  │
│   (Browser)     │    │   (MongoDB)     │    │   (Local/Cloud) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Backend Technologies
- **Python 3.9+**: Core programming language
- **Flask 2.0+**: Lightweight web framework for API development
- **MongoDB**: NoSQL database for user data, conversations, and assessments
- **JWT**: JSON Web Tokens for secure authentication and authorization
- **Flask-Mail**: Email service integration for notifications and password resets
- **Together.AI**: Large Language Model integration for conversational AI
- **OpenAI Whisper**: Speech-to-text transcription service
- **ElevenLabs**: Text-to-speech synthesis for voice responses
- **VADER**: Sentiment analysis library for emotion detection
- **FPDF**: PDF report generation for wellness summaries
- **BCrypt**: Password hashing and security utilities

#### Frontend Technologies
- **React 19**: Modern JavaScript framework for user interface
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **React Router**: Client-side routing for single-page application
- **Axios**: HTTP client for API communication
- **JS-Cookie**: Cookie management for session handling
- **Recharts**: Data visualization library for analytics
- **Lucide React**: Modern icon library
- **React Markdown**: Markdown rendering for formatted content

#### Development & Deployment
- **Node.js & npm**: Frontend package management
- **pip & venv**: Python package management and virtual environments
- **CORS**: Cross-origin resource sharing configuration
- **Docker**: Containerization for consistent deployment
- **Gunicorn**: WSGI HTTP Server for production deployment

### Project Structure
```
_Mitra-main/
├── app/
│   ├── routes/                 # API endpoint definitions
│   │   ├── auth_routes.py      # Authentication & user management
│   │   ├── chatbot_routes.py   # AI chatbot interactions
│   │   ├── user_routes.py      # User profile management
│   │   ├── test_routes.py      # Mental health assessments
│   │   └── emergency_routes.py # Crisis intervention
│   ├── utils/                  # Utility modules
│   │   ├── logger_utils.py     # Centralized logging system
│   │   ├── security.py         # Security & encryption utilities
│   │   └── mail.py            # Email service integration
│   ├── data/                   # Data storage & ML models
│   │   ├── Clinical_Data/      # Assessment questionnaires
│   │   ├── model.h5           # Pre-trained ML models
│   │   └── haarcascade_frontalface_default.xml
│   ├── music_samples/          # Therapeutic audio files
│   ├── static/                 # Static assets and generated content
│   ├── config.py              # Application configuration
│   ├── models.py              # Database models and schemas
│   └── __init__.py            # Flask app initialization
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Login.jsx       # User authentication
│   │   │   ├── Register.jsx    # User registration
│   │   │   ├── Chatbotnew.jsx  # AI chatbot interface
│   │   │   ├── Profile.jsx     # User profile management
│   │   │   ├── AssessmentTestPage.jsx # Mental health tests
│   │   │   ├── Selfcare.jsx    # Self-care activities
│   │   │   ├── Music_Generation.jsx # Music therapy
│   │   │   ├── VoiceAssistant.jsx # Voice interaction
│   │   │   └── emergency.jsx   # Crisis support
│   │   ├── assets/            # Images, icons, media files
│   │   ├── App.jsx            # Main application component
│   │   └── index.jsx          # React entry point
│   ├── public/                # Static public assets
│   ├── package.json           # Node.js dependencies
│   └── tailwind.config.js     # Tailwind CSS configuration
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── run.py                     # Application entry point
└── README.md                  # Project documentation
```

---

## API Endpoints

### Base URL
```
Production: https://api.mitra.com
Development: http://localhost:5000
```

### Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/register` | User registration with email/password | ❌ |
| `POST` | `/api/v1/login` | User login with credentials | ❌ |
| `GET` | `/api/v1/login/google` | Google OAuth login initiation | ❌ |
| `GET` | `/api/v1/callback` | Google OAuth callback handler | ❌ |
| `POST` | `/api/v1/forgot-password` | Password reset request | ❌ |
| `POST` | `/api/v1/reset-password/<token>` | Password reset confirmation | ❌ |
| `POST` | `/api/v1/logout` | User logout and token invalidation | ✅ |

### Chatbot Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/api/chat` | Send message to AI chatbot | ✅ |
| `POST` | `/api/v1/api/voice-chat` | Voice interaction with chatbot | ✅ |
| `GET` | `/api/v1/api/chat-history` | Retrieve conversation history | ✅ |
| `DELETE` | `/api/v1/api/chat-history` | Clear conversation history | ✅ |
| `POST` | `/api/v1/api/generate_selfcare_pdf` | Generate wellness report PDF | ✅ |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/profile` | Get user profile information | ✅ |
| `PUT` | `/api/v1/profile` | Update user profile | ✅ |
| `GET` | `/api/v1/get-username` | Get current username | ✅ |
| `POST` | `/api/v1/update-preferences` | Update chatbot preferences | ✅ |
| `DELETE` | `/api/v1/account` | Delete user account | ✅ |

### Assessment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/test/questions` | Get assessment questions (PHQ-9, GAD-7) | ✅ |
| `POST` | `/api/v1/test/submit` | Submit assessment responses | ✅ |
| `GET` | `/api/v1/test/results` | Get latest assessment results | ✅ |
| `GET` | `/api/v1/test/history` | Get assessment history | ✅ |
| `GET` | `/api/v1/test/analytics` | Get assessment analytics | ✅ |

### Music Therapy Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/music/generate` | Generate therapeutic music | ✅ |
| `GET` | `/api/v1/music/library` | Get user's music library | ✅ |
| `POST` | `/api/v1/music/save` | Save generated music track | ✅ |
| `DELETE` | `/api/v1/music/<track_id>` | Delete music track | ✅ |
| `GET` | `/api/v1/music/recommendations` | Get mood-based recommendations | ✅ |

### Emergency Support Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/emergency/crisis-detection` | Crisis situation detection | ✅ |
| `GET` | `/api/v1/emergency/resources` | Get emergency resources | ✅ |
| `POST` | `/api/v1/emergency/safety-plan` | Create/update safety plan | ✅ |
| `GET` | `/api/v1/emergency/hotlines` | Get crisis hotlines by location | ❌ |

### Example API Usage

#### Send Chat Message
```javascript
// Request
POST /api/v1/api/chat
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "message": "I'm feeling anxious about work",
  "context": "work_stress"
}

// Response
{
  "response": "I understand work can be stressful. Let's explore some coping strategies...",
  "sentiment": {
    "compound": -0.3,
    "emotion": "anxiety",
    "confidence": 0.85
  },
  "suggestions": ["breathing_exercise", "mindfulness", "music_therapy"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Submit PHQ-9 Assessment
```javascript
// Request
POST /api/v1/test/submit
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "assessment_type": "PHQ9",
  "responses": {
    "q1": 2,
    "q2": 1,
    "q3": 3,
    "q4": 2,
    "q5": 1,
    "q6": 0,
    "q7": 2,
    "q8": 1,
    "q9": 0
  }
}

// Response
{
  "assessment_id": "64f8a1b2c3d4e5f6g7h8i9j0",
  "score": 12,
  "severity": "moderate",
  "interpretation": "Moderate depression symptoms detected",
  "recommendations": [
    "Consider speaking with a mental health professional",
    "Engage in regular self-care activities",
    "Monitor mood changes closely"
  ],
  "next_assessment_date": "2024-02-15T00:00:00Z"
}
```

---

## Frontend Overview

### User Interface Design
The frontend is built with React 19 and Tailwind CSS, providing a modern, responsive, and accessible user experience.

### Key Pages & Components

#### 1. Home Page (`Home.jsx`)
- **Landing Interface**: Welcome screen with platform introduction
- **Quick Actions**: Direct access to chat, voice, and emergency features
- **Feature Overview**: Visual presentation of platform capabilities
- **User Onboarding**: Guided tour for new users

#### 2. Authentication Pages
- **Login (`Login.jsx`)**: Email/password and Google OAuth login
- **Register (`Register.jsx`)**: User registration with email verification
- **Password Reset**: Forgot password and reset functionality

#### 3. Chat Interface (`Chatbotnew.jsx`)
- **Real-time Messaging**: Instant AI chatbot responses
- **Message History**: Persistent conversation history
- **Sentiment Indicators**: Visual mood tracking in conversations
- **Quick Actions**: Predefined response buttons
- **Voice Integration**: Switch between text and voice modes

#### 4. Voice Assistant (`VoiceAssistant.jsx`)
- **Speech Recognition**: Real-time voice-to-text conversion
- **Voice Synthesis**: Natural text-to-speech responses
- **Visual Feedback**: Waveform visualization during recording
- **Hands-free Operation**: Complete voice-based interaction

#### 5. Assessment Page (`AssessmentTestPage.jsx`)
- **Interactive Questionnaires**: PHQ-9 and GAD-7 assessments
- **Progress Tracking**: Visual progress indicators
- **Results Display**: Immediate scoring and interpretation
- **Historical Data**: Previous assessment results and trends

#### 6. Self-Care Activities (`Selfcare.jsx`)
- **Activity Categories**: Meditation, breathing, journaling, CBT exercises
- **Guided Instructions**: Step-by-step activity guidance
- **Progress Tracking**: Completion status and streaks
- **Personalized Recommendations**: AI-suggested activities

#### 7. Music Therapy (`Music_Generation.jsx`)
- **AI Music Generation**: Create personalized therapeutic music
- **Mood-Based Selection**: Music recommendations based on current state
- **Playback Controls**: Full audio player with playlist management
- **Download Options**: Save favorite tracks for offline use

#### 8. User Profile (`Profile.jsx`)
- **Profile Management**: Update personal information and preferences
- **Privacy Settings**: Control data sharing and visibility
- **Notification Preferences**: Customize alerts and reminders
- **Account Security**: Password changes and security settings

#### 9. Emergency Support (`emergency.jsx`)
- **Crisis Resources**: Immediate access to emergency contacts
- **Safety Planning**: Create and manage personal safety plans
- **Location Services**: Find nearby crisis centers and hotlines
- **Quick Actions**: One-tap emergency contact options

### Responsive Design
- **Mobile-First**: Optimized for mobile devices with touch-friendly interfaces
- **Tablet Support**: Adapted layouts for tablet screens
- **Desktop Experience**: Full-featured desktop interface
- **Cross-Browser**: Compatible with all modern browsers

### Accessibility Features
- **WCAG 2.1 AA Compliance**: Meets accessibility standards
- **Screen Reader Support**: Compatible with assistive technologies
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for high contrast themes
- **Font Scaling**: Adjustable text sizes

---

## Getting Started

### Prerequisites
- **Python 3.9+** installed on your system
- **Node.js 18+** and npm
- **MongoDB** database (local or cloud)
- **Git** for version control

### Installation Steps

#### 1. Clone the Repository
```bash
git clone -b Smit https://github.com/your-username/_Mitra.git
cd _Mitra-main
```

#### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install Python dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup (Open new terminal)
```bash
cd frontend
npm install
```

#### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017/_mitra
MONGO_DB_NAME=_mitra

# JWT Configuration
JWT_SECRET_KEY=your_super_secret_jwt_key_here

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# OAuth Configuration
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
AUTHORIZATION_BASE_URL=https://accounts.google.com/o/oauth2/auth
TOKEN_URL=https://oauth2.googleapis.com/token
REDIRECT_URL=http://localhost:5000/api/v1/callback

# AI Service Configuration
TOGETHER_API_KEY=your_together_ai_api_key
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

#### 5. Start the Application

**Terminal 1 - Backend:**
```bash
python run.py
```
*Backend will run on `http://localhost:5000`*

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
*Frontend will run on `http://localhost:3000`*

---

## Security & Privacy

### Security Measures
1. **Authentication & Authorization**
   - JWT tokens with automatic refresh rotation
   - Multi-factor authentication support
   - Role-based access control
   - Session management with timeout

2. **Data Protection**
   - AES-256 encryption for sensitive data
   - HTTPS/TLS 1.3 for all communications
   - BCrypt password hashing with salt
   - Input validation and sanitization

3. **Infrastructure Security**
   - Regular security audits and penetration testing
   - Dependency vulnerability scanning
   - Container security best practices
   - Network segmentation and firewalls

### Privacy Protection
- **Data Minimization**: Collect only necessary information
- **User Control**: Granular privacy settings and data export
- **Anonymization**: Remove PII from analytics data
- **Retention Policies**: Automatic data deletion after specified periods
- **Consent Management**: Clear consent mechanisms for data processing

### Compliance
- **GDPR Compliance**: Full compliance for EU users
- **HIPAA Considerations**: Health data protection measures
- **SOC 2 Type II**: Security certification standards
- **Regular Audits**: Ongoing compliance monitoring

---

## Deployment Options

### Local Development
- **Development Server**: Flask development server with hot reload
- **Database**: Local MongoDB instance
- **Frontend**: React development server with live reload

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
```

### Cloud Deployment
- **AWS**: ECS/Fargate with RDS and CloudFront
- **Google Cloud**: Cloud Run with Cloud SQL
- **Heroku**: Simple deployment with add-ons
- **Azure**: App Service with Cosmos DB

---

## Team

### Core Development Team
- **Smit Gandhi** - *Project Lead & Backend Architecture*
  - Authentication systems, database design, API development
- **Dhruvil** - *Backend APIs & AI Integration*
  - Chatbot implementation, sentiment analysis, LLM integration
- **Prachi** - *UI/UX Design & AI Fine-tuning*
  - User interface design, chatbot personality, user experience

---

## Support & Resources

- **Documentation**: Complete guides in `/docs` directory
- **API Reference**: Detailed endpoint documentation
- **Issues**: [GitHub Issues](https://github.com/your-username/_Mitra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/_Mitra/discussions)
- **Email**: support@mitra.com

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

** Mitra - Empowering Mental Wellness Through AI**

*Built with ❤️ by Team  | Making Mental Health Support Accessible to Everyone*

</div>
