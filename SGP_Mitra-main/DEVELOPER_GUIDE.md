#  Mitra - Developer Guide

## 🚀 Development Setup

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **MongoDB** (local or Atlas)
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Quick Setup
```bash
# Clone repository
git clone -b Smit https://github.com/your-username/_Mitra.git
cd _Mitra-main

# Backend setup
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend setup (new terminal)
cd frontend
npm install

# Environment configuration
cp .env.example .env  # Configure your API keys
```

## 🏗️ Development Architecture

### Project Structure
```
_Mitra-main/
├── app/                    # Flask backend
│   ├── routes/            # API endpoints
│   ├── utils/             # Utility functions
│   ├── data/              # Data files & models
│   ├── config.py          # Configuration
│   ├── models.py          # Database & AI models
│   └── __init__.py        # App factory
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── assets/        # Static assets
│   └── public/            # Public files
├── logs/                  # Application logs
└── requirements.txt       # Python dependencies
```

### Development Workflow
1. **Feature Branch**: Create from `main` branch
2. **Development**: Implement features with tests
3. **Testing**: Run unit and integration tests
4. **Code Review**: Submit pull request
5. **Deployment**: Merge to main triggers deployment

## 🔧 Backend Development

### Flask Application Structure
```python
# app/__init__.py - Application Factory Pattern
def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config.from_object(Config)
    
    # Extensions
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app)
    
    # Database
    app.db = MongoClient(app.config["MONGO_URL"])
    
    # Blueprints
    app.register_blueprint(auth_routes, url_prefix="/api/v1")
    app.register_blueprint(chatbot_routes, url_prefix="/api/v1")
    
    return app
```

### API Route Development
```python
# app/routes/example_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.logger_utils import get_logger

example_routes = Blueprint('example', __name__)
logger = get_logger(__name__)

@example_routes.route('/api/endpoint', methods=['POST'])
@jwt_required()
def example_endpoint():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Business logic here
        result = process_data(data)
        
        logger.info(f"[INFO] Endpoint processed for user: {user_id}")
        return jsonify({"success": True, "data": result}), 200
        
    except Exception as e:
        logger.error(f"[ERROR] Endpoint failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
```

### Database Operations
```python
# MongoDB operations
from app.models import db

# Insert document
def create_user(user_data):
    result = db.users.insert_one(user_data)
    return str(result.inserted_id)

# Find documents
def get_user_chats(user_id):
    return list(db.chats.find({"user_id": user_id}))

# Update document
def update_user_preferences(user_id, preferences):
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"preferences": preferences}}
    )
```

### AI Integration
```python
# app/models.py - AI Service Setup
from langchain_openai import ChatOpenAI
from elevenlabs.client import ElevenLabs

# LLM Configuration
llm = ChatOpenAI(
    model="lgai/exaone-3-5-32b-instruct",
    openai_api_key=os.getenv('TOGETHER_API_KEY'),
    openai_api_base="https://api.together.xyz/v1",
    temperature=0.001
)

# Voice Services
elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
whisper_model = whisper.load_model("base")
```

### Logging Implementation
```python
# Following the comprehensive logging system memory
from app.utils.logger_utils import get_logger

logger = get_logger(__name__)

# Replace print statements with appropriate log levels
logger.debug("[DEBUG] Detailed debugging information")
logger.info("[INFO] General information about program execution")
logger.warning("[WARNING] Something unexpected happened")
logger.error("[ERROR] A serious error occurred", exc_info=True)
logger.critical("[CRITICAL] Program may not be able to continue")
```

## ⚛️ Frontend Development

### React Component Structure
```jsx
// src/components/ExampleComponent.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExampleComponent = ({ userId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            const response = await axios.get(`/api/v1/data/${userId}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            {/* Component content */}
        </div>
    );
};

export default ExampleComponent;
```

### State Management
```jsx
// Context for global state
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    
    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};
```

### API Integration
```jsx
// src/services/api.js
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Request interceptor for auth token
axios.interceptors.request.use((config) => {
    const token = Cookies.get('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API functions
export const chatAPI = {
    sendMessage: (message) => axios.post('/api/chat', { message }),
    getChatHistory: () => axios.get('/api/chat-history'),
    voiceChat: (audioData) => axios.post('/api/voice-chat', audioData)
};
```

## 🧪 Testing

### Backend Testing
```python
# tests/test_routes.py
import pytest
from app import create_app
from app.models import db

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_login_endpoint(client):
    response = client.post('/api/v1/login', json={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    assert response.status_code == 200
    assert 'access_token' in response.get_json()

def test_chat_endpoint(client):
    # Login first to get token
    login_response = client.post('/api/v1/login', json={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    token = login_response.get_json()['access_token']
    
    # Test chat endpoint
    response = client.post('/api/v1/api/chat', 
        json={'message': 'Hello Mitra'},
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
```

### Frontend Testing
```jsx
// src/components/__tests__/ExampleComponent.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExampleComponent from '../ExampleComponent';

describe('ExampleComponent', () => {
    test('renders component correctly', () => {
        render(<ExampleComponent userId="123" />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('handles user interaction', async () => {
        const user = userEvent.setup();
        render(<ExampleComponent userId="123" />);
        
        const button = screen.getByRole('button', { name: /click me/i });
        await user.click(button);
        
        await waitFor(() => {
            expect(screen.getByText('Button clicked!')).toBeInTheDocument();
        });
    });
});
```

### Running Tests
```bash
# Backend tests
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm test

# Coverage reports
python -m pytest --cov=app tests/
npm test -- --coverage
```

## 🔐 Security Best Practices

### Authentication & Authorization
```python
# JWT token management
from flask_jwt_extended import create_access_token, create_refresh_token

def generate_tokens(user_id):
    access_token = create_access_token(
        identity=user_id,
        expires_delta=timedelta(hours=1)
    )
    refresh_token = create_refresh_token(
        identity=user_id,
        expires_delta=timedelta(days=30)
    )
    return access_token, refresh_token
```

### Input Validation
```python
from marshmallow import Schema, fields, validate

class UserRegistrationSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))

def validate_input(schema, data):
    try:
        result = schema.load(data)
        return result, None
    except ValidationError as err:
        return None, err.messages
```

### Password Security
```python
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)
```

## 🚀 Deployment

### Environment Configuration
```bash
# Production environment variables
export FLASK_ENV=production
export MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/_mitra
export JWT_SECRET_KEY=your_production_secret
export TOGETHER_API_KEY=your_production_key
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
```

### Production Deployment
```bash
# Build and deploy
docker build -t -mitra .
docker run -p 5000:5000 --env-file .env -mitra

# Or with docker-compose
docker-compose up -d
```

## 📊 Performance Optimization

### Database Optimization
```python
# Create indexes for better query performance
db.users.create_index("email", unique=True)
db.chats.create_index([("user_id", 1), ("timestamp", -1)])
db.assessments.create_index("user_id")
```

### Caching Strategy
```python
from functools import lru_cache
import redis

# In-memory caching
@lru_cache(maxsize=128)
def get_user_preferences(user_id):
    return db.users.find_one({"_id": ObjectId(user_id)})["preferences"]

# Redis caching
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_user_session(user_id, session_data):
    redis_client.setex(f"session:{user_id}", 3600, json.dumps(session_data))
```

## 🐛 Debugging

### Debug Configuration
```python
# app/config.py
class DevelopmentConfig:
    DEBUG = True
    TESTING = False
    LOG_LEVEL = 'DEBUG'

class ProductionConfig:
    DEBUG = False
    TESTING = False
    LOG_LEVEL = 'INFO'
```

### Debugging Tools
```python
# Use pdb for debugging
import pdb; pdb.set_trace()

# Or use logging for production debugging
logger.debug(f"[DEBUG] Variable value: {variable}")
logger.info(f"[INFO] Function called with params: {params}")
```

## 📝 Code Style & Standards

### Python Style Guide
```python
# Follow PEP 8 standards
# Use meaningful variable names
user_authentication_token = generate_token(user_id)

# Function documentation
def process_chat_message(message: str, user_id: str) -> dict:
    """
    Process incoming chat message and generate AI response.
    
    Args:
        message (str): User's input message
        user_id (str): Unique user identifier
        
    Returns:
        dict: Response containing AI message and metadata
    """
    pass
```

### JavaScript/React Style Guide
```jsx
// Use meaningful component names
const ChatMessageComponent = ({ message, timestamp, isUser }) => {
    // Use descriptive variable names
    const formattedTimestamp = formatTimestamp(timestamp);
    
    return (
        <div className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
            <p>{message}</p>
            <span className="timestamp">{formattedTimestamp}</span>
        </div>
    );
};

// PropTypes for type checking
ChatMessageComponent.propTypes = {
    message: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    isUser: PropTypes.bool.isRequired
};
```

## 🤝 Contributing Guidelines

### Pull Request Process
1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request** with detailed description

### Commit Message Format
```
type(scope): brief description

Detailed explanation of changes made.

- Added new feature X
- Fixed bug in component Y
- Updated documentation for Z

Closes #123
```

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Logging implemented appropriately

## 🔍 Monitoring & Maintenance

### Health Checks
```python
@app.route('/health')
def health_check():
    try:
        # Check database connection
        db.admin.command('ping')
        
        # Check AI service availability
        test_response = llm.invoke("test")
        
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "ai_service": "available",
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500
```

### Log Analysis
```bash
# Analyze application logs
grep "ERROR" logs/*.log | tail -20
grep "user_login" logs/*.log | wc -l

# Monitor performance
tail -f logs/$(date +%Y%m%d_%H%M%S).log | grep "PERFORMANCE"
```

## 📚 Additional Resources

- **Flask Documentation**: https://flask.palletsprojects.com/
- **React Documentation**: https://reactjs.org/docs/
- **MongoDB Documentation**: https://docs.mongodb.com/
- **Together AI API**: https://docs.together.ai/
- **ElevenLabs API**: https://docs.elevenlabs.io/

---

## 🎯 Development Roadmap

### Current Sprint
- [ ] Enhanced voice interaction features
- [ ] Improved sentiment analysis accuracy
- [ ] Mobile responsive design updates
- [ ] Performance optimization

### Future Features
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with wearable devices
- [ ] Group therapy sessions
- [ ] Therapist collaboration tools

---

**Happy coding! 🚀** 

*Remember: Mental health technology requires extra care and attention to user safety and privacy.*
