# SGP Mitra - AI-Powered Mental Wellness Assistant 

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)

###  **Demo Video**: [View Project Demo](https://drive.google.com/drive/folders/1UT4d0eRqJ1zEbYlfFOOReaX_usj8MpnZ?usp=sharing)

##  About The Project

**SGP Mitra** is an advanced AI-powered mental wellness assistant designed to provide personalized emotional support and mental health guidance. Built with modern web technologies, it combines the power of Large Language Models (LLMs), sentiment analysis, and machine learning to deliver a comprehensive mental health platform.

###  **Key Objectives**
- Provide 24/7 accessible mental health support
- Deliver personalized therapy recommendations based on user sentiment
- Create a safe space for users to express their emotions
- Generate actionable self-care plans and wellness reports
- Support multiple interaction modes (text, voice, assessments)

###  **Core Features**

####  **Authentication & Security**
- **Multi-factor Authentication**: Email/password and Google OAuth integration
- **Secure Password Management**: BCrypt hashing with reset functionality
- **JWT Token-based Authorization**: Secure API access with refresh tokens
- **Session Management**: Persistent login with secure cookie handling

####  **AI-Powered Chatbot**
- **Sentiment-Aware Responses**: VADER sentiment analysis for mood tracking
- **Personalized Conversations**: LLM integration with user preference adaptation
- **Voice Interaction**: Speech-to-text and text-to-speech capabilities
- **Context Retention**: Conversation history and context awareness
- **Emergency Detection**: Crisis intervention and emergency contact features

####  **Mental Health Assessment**
- **Comprehensive Testing**: Multi-dimensional psychological assessments
- **Progress Tracking**: Historical mood and wellness trend analysis
- **PDF Report Generation**: Detailed self-care plans and progress reports
- **Data Visualization**: Interactive charts and wellness metrics

####  **Therapeutic Tools**
- **Music Therapy**: AI-generated therapeutic music based on mood
- **Guided Meditation**: Breathing exercises and mindfulness sessions
- **Self-Care Activities**: Personalized wellness recommendations
- **Emergency Support**: Crisis hotline integration and immediate assistance

##  Project Architecture

```
SGP_Mitra-main/
│   ├── app/
│   │   ├── routes/                 # API endpoint definitions
│   │   │   ├── auth_routes.py      # Authentication & user management
│   │   │   ├── chatbot_routes.py   # AI chatbot interactions
│   │   │   ├── user_routes.py      # User profile management
│   │   │   ├── test_routes.py      # Mental health assessments
│   │   │   └── emergency_routes.py # Crisis intervention
│   │   ├── utils/                  # Utility modules
│   │   │   ├── logger_utils.py     # Centralized logging system
│   │   │   ├── security.py         # Security & encryption utilities
│   │   │   └── mail.py            # Email service integration
│   │   ├── data/                   # Data storage & models
│   │   ├── music_samples/          # Therapeutic audio files
│   │   ├── static/                 # Static assets
│   │   ├── config.py              # Application configuration
│   │   ├── models.py              # Database models
│   │   └── __init__.py            # Flask app initialization
│   ├── logs/                      # Application logs
│   ├── requirements.txt           # Python dependencies
│   └── run.py                     # Application entry point
│
├── Frontend (React + JavaScript)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page-level components
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # User authentication
│   │   │   ├── Register.jsx       # User registration
│   │   │   ├── Chatbotnew.jsx     # AI chatbot interface
│   │   │   ├── Profile.jsx        # User profile management
│   │   │   ├── AssessmentTestPage.jsx # Mental health tests
│   │   │   ├── Selfcare.jsx       # Self-care activities
│   │   │   ├── Music_Generation.jsx # Music therapy
│   │   │   ├── VoiceAssistant.jsx # Voice interaction
│   │   │   └── emergency.jsx      # Crisis support
│   │   ├── assets/                # Images, icons, media
│   │   ├── App.jsx                # Main application component
│   │   └── index.jsx              # React entry point
│   ├── public/                    # Static public assets
│   ├── package.json               # Node.js dependencies
│   └── tailwind.config.js         # Tailwind CSS configuration
│
├── Configuration Files
│   ├── .env                       # Environment variables
│   ├── .gitignore                # Git ignore rules
│   ├── LICENSE                   # MIT License
│   └── README.md                 # Project documentation
```

##  Technology Stack

###  **Backend Technologies**
- **Python 3.8+**: Core programming language
- **Flask**: Lightweight web framework
- **MongoDB**: NoSQL database for user data
- **JWT**: JSON Web Tokens for authentication
- **Flask-Mail**: Email service integration
- **OpenAI/Together AI**: LLM integration for chatbot
- **VADER**: Sentiment analysis library
- **ElevenLabs**: Text-to-speech synthesis
- **Whisper**: Speech-to-text transcription
- **TensorFlow**: Machine learning models
- **FPDF**: PDF report generation

###  **Frontend Technologies**
- **React 19.0**: Modern JavaScript framework
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **JS-Cookie**: Cookie management
- **Recharts**: Data visualization
- **Lucide React**: Icon library
- **React Markdown**: Markdown rendering

###  **Development & Deployment**
- **Node.js & npm**: Frontend package management
- **pip & venv**: Python package management
- **CORS**: Cross-origin resource sharing
- **Comprehensive Logging**: Centralized logging system
- **Environment Variables**: Secure configuration management

##  Quick Start Guide

###  **Prerequisites**
- **Python 3.8+** installed on your system
- **Node.js 16+** and npm
- **MongoDB** database (local or cloud)
- **Git** for version control

###  **Installation Steps**

####  **1. Clone the Repository**
```bash
git clone -b Smit https://github.com/your-username/SGP_Mitra.git
cd SGP_Mitra-main
```

####  **2. Backend Setup**
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install Python dependencies
pip install -r requirements.txt
```

####  **3. Frontend Setup** (Open new terminal)
```bash
cd frontend
npm install
```

####  **4. Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017/sgp_mitra
MONGO_DB_NAME=sgp_mitra

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

####  **5. Start the Application**

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

##  Configuration Guide

###  **Database Setup**
1. **Install MongoDB** locally or use MongoDB Atlas (cloud)
2. **Create database** named `sgp_mitra`
3. **Update connection string** in `.env` file
4. **Collections will be created automatically** on first run

###  **Email Service Setup**
1. **Enable 2FA** on your Gmail account
2. **Generate App Password** in Google Account settings
3. **Use App Password** (not regular password) in `MAIL_PASSWORD`

###  **AI Service Setup**
1. **Together AI**: Sign up at [together.ai](https://together.ai) for LLM access
2. **OpenAI**: Get API key from [openai.com](https://openai.com) (optional)
3. **ElevenLabs**: Register at [elevenlabs.io](https://elevenlabs.io) for voice synthesis

###  **OAuth Setup**
1. **Google Cloud Console**: Create new project
2. **Enable Google+ API** and **OAuth 2.0**
3. **Create OAuth credentials** and add redirect URIs
4. **Update CLIENT_ID and CLIENT_SECRET** in `.env`

##  API Documentation

###  **Authentication Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/register` | User registration | 
| `POST` | `/api/v1/login` | User login | 
| `GET` | `/api/v1/login/google` | Google OAuth login | 
| `POST` | `/api/v1/forgot-password` | Password reset request | 
| `POST` | `/api/v1/reset-password/<token>` | Password reset confirmation | 
| `POST` | `/api/v1/logout` | User logout | 

###  **Chatbot Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/api/chat` | Send message to AI chatbot | 
| `POST` | `/api/v1/api/voice-chat` | Voice interaction with chatbot | 
| `GET` | `/api/v1/api/chat-history` | Retrieve conversation history | 
| `POST` | `/api/v1/api/generate_selfcare_pdf` | Generate wellness report | 

###  **User Management Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/profile` | Get user profile | 
| `PUT` | `/api/v1/profile` | Update user profile | 
| `GET` | `/api/v1/get-username` | Get username | 
| `POST` | `/api/v1/update-preferences` | Update chatbot preferences | 

###  **Assessment Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/test/questions` | Get assessment questions | 
| `POST` | `/api/v1/test/submit` | Submit assessment responses | 
| `GET` | `/api/v1/test/results` | Get assessment results | 
| `GET` | `/api/v1/test/history` | Get assessment history | 


##  Features Deep Dive

###  **AI Chatbot System**
- **Sentiment Analysis**: Real-time emotion detection using VADER
- **Contextual Responses**: Maintains conversation context across sessions
- **Personalization**: Adapts responses based on user preferences and history
- **Crisis Detection**: Identifies potential mental health emergencies
- **Multi-modal Input**: Supports text and voice interactions

###  **Mental Health Assessments**
- **Standardized Tests**: PHQ-9, GAD-7, and custom wellness assessments
- **Progress Tracking**: Historical data analysis and trend identification
- **Personalized Insights**: AI-generated recommendations based on results
- **PDF Reports**: Comprehensive wellness reports for users and healthcare providers

###  **Therapeutic Tools**
- **Music Therapy**: AI-generated music based on current mood and preferences
- **Guided Meditation**: Interactive breathing exercises and mindfulness sessions
- **Self-Care Plans**: Personalized activity recommendations
- **Progress Monitoring**: Track engagement and improvement over time

###  **Security & Privacy**
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **GDPR Compliance**: User data protection and privacy controls
- **Secure Authentication**: Multi-factor authentication with JWT tokens
- **Audit Logging**: Comprehensive logging for security monitoring

##  Contributing

We welcome contributions from the community! Here's how you can help:

###  **Getting Started**
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** and test thoroughly
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** with detailed description

###  **Development Guidelines**
- **Follow PEP 8** for Python code style
- **Use ESLint** for JavaScript code formatting
- **Write comprehensive tests** for new features
- **Update documentation** for API changes
- **Use meaningful commit messages**

###  **Bug Reports**
- **Use GitHub Issues** to report bugs
- **Include detailed reproduction steps**
- **Provide system information** and error logs
- **Add screenshots** if applicable

##  License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

##  Team

###  **Core Development Team**
- **Smit Gandhi** - *Project Lead & Backend Architecture*
  - Authentication systems, database design, API development
- **Dhruvil** - *Backend APIs & AI Integration*
  - Chatbot implementation, sentiment analysis, LLM integration
- **Prachi** - *UI/UX Design & AI Fine-tuning*
  - User interface design, chatbot personality, user experience

##  Acknowledgments

- **OpenAI** for GPT models and Whisper speech recognition
- **Together AI** for LLM API services
- **ElevenLabs** for text-to-speech synthesis
- **MongoDB** for database services
- **React Community** for excellent documentation and resources
- **Flask Community** for the lightweight web framework
- **Mental Health Organizations** for guidance on best practices

##  Support

- **Email**: support@sgpmitra.com
- **Issues**: [GitHub Issues](https://github.com/your-username/SGP_Mitra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/SGP_Mitra/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/SGP_Mitra/wiki)

##  Changelog

###  **Version 2.0.0** (Current)
- Added comprehensive logging system
- Implemented voice interaction capabilities
- Enhanced security with JWT refresh tokens
- Added mental health assessment tools
- Integrated music therapy features
- Improved UI/UX with Tailwind CSS

###  **Version 1.0.0**
- Basic chatbot functionality
- User authentication system
- MongoDB integration
- React frontend implementation

---

<div align="center">

** SGP Mitra - Empowering Mental Wellness Through AI **

*Built with  by Team SGP | Making Mental Health Support Accessible to Everyone*

[![GitHub stars](https://img.shields.io/github/stars/your-username/SGP_Mitra?style=social)](https://github.com/your-username/SGP_Mitra/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/your-username/SGP_Mitra?style=social)](https://github.com/your-username/SGP_Mitra/network/members)

</div>
3. python -m venv venv
4. venv\Scripts\activate
5. pip install -r requirements.txt
--- (Parallely open new terminal)
6. cd frontend
7. npm install
8. npm start
(in another terminal after installing python libraries)
9. python run.py