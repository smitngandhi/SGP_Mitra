=======
# Team-45_Mitra

### video-link :- "https://drive.google.com/drive/folders/1UT4d0eRqJ1zEbYlfFOOReaX_usj8MpnZ?usp=sharing"

## Overview
**Mitra** is an AI-powered mental wellness assistant that provides users with emotional support and personalized self-care plans based on sentiment analysis of chat interactions. The backend is built using **Flask**, incorporating **MongoDB** for user and chat storage, **VADER Sentiment Analysis** for mood tracking, and **FPDF** for generating self-care reports.

## Features
- **User Authentication** (Registration, Login, Google Authentication, Password Recovery)
- **Chatbot API** (LLM-based mental health chatbot with sentiment-aware responses)
- **Sentiment Analysis** (Tracks user emotions and adjusts chatbot behavior accordingly)
- **Self-Care Plan Generation** (Creates PDF reports based on sentiment trends)
- **Secure API Endpoints** (JWT authentication, request validation, and security best practices)

## Project Structure
```
Team-45_Mitra/
│── backend/
│   │── routes/
│   │   │── auth_routes.py        # Handles user authentication (login, register, password reset)
│   │   │── chatbot_routes.py     # Chatbot API for generating responses and sentiment analysis
│   │   │── test_routes.py        # Routes for testing purposes
│   │   │── user_routes.py        # Handles user-related actions like profile retrieval
│   │── utils/
│   │   │── mail.py               # Email handling for password recovery & self-care plan delivery
│   │   │── security.py           # Security utilities (password hashing, JWT verification)
│   │   │── config.py             # Configuration settings (DB connections, API keys, etc.)
│   │   │── models.py             # Defines database models for users and chats
│   └── __init__.py               # Initializes Flask application
│── README.md                     # Project documentation
│── requirements.txt              # dependencies need to install before running
```

## Installation & Setup
### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/Team-45_Mitra.git
cd Team-45_Mitra

```
### 2. Create a Virtual Environment & Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```
### 3. Configure Environment Variables
Create a `.env` file in the root directory and add the following:
```
MONGO_URL="YOUR_MONGO_URL"
JWT_SECRET_KEY="supersecretkey31"
MAIL_SERVER="smtp.gmail.com"
MAIL_PORT=587
MAIL_USE_TLS="True"
MAIL_USERNAME="YOUR_BUISNESS_GMAIL"
MAIL_PASSWORD="AUTHENTICATION PASSWORD"
MONGO_DB_NAME="mydatabase"
CLIENT_ID='YOUR_CLIENT_ID'
CLIENT_SECRET='YOUR_CLIENT_ID'
TOGETHER_API_KEY="YOUR_TOGETHER_API_KEY"
```

### 4. Run the Flask Application
```bash
python run.py
```
The server will start at `http://127.0.0.1:5000`

## API Endpoints
### Authentication Routes
| Method | Endpoint            | Description |
|--------|---------------------|-------------|
| POST   | `/api/v1/register`     | User registration |
| POST   | `/api/v1/login`        | User login |
| POST   | `/api/v1/forgot-password` | Sends password reset email |
| POST   | `/api/v1/reset-password/<token>` | Resets user password |
| GET   | `/api/v1/login/google` | Authorization by google |


### Chatbot Routes
| Method | Endpoint                | Description |
|--------|-------------------------|-------------|
| POST   | `/api/v1/api/chat`             | Generates chatbot response & sentiment analysis |
| POST   | `/api/v1/api/generate_selfcare_pdf` | Generates and emails self-care plan PDF |

### User Routes
| Method | Endpoint       | Description |
|--------|---------------|-------------|
| GET    | `/api/v1/get-username` | Fetches user username |
| POST   | `/api/user/update-profile` | Updates user profile |
| GET    | `/api/v1/profile` | Fetches user details |

## Key Components
- **`init.py`**: Initializes Flask, JWT, Mail, OAuth, and database connections.
- **`config.py`**: Manages app configurations via environment variables.
- **`models.py`**: Defines MongoDB collections (`users`, `chats`).

# MITRA Frontend

## Overview
The **MITRA Frontend** is a React-based user interface designed for the MITRA AI-powered mental wellness assistant. It serves as the primary platform where users can interact with the chatbot, access therapy recommendations, and explore self-care resources.

## Tech Stack
- **Frontend Framework:** React.js
- **Styling:** Tailwind CSS
- **State Management:** Context API (or Redux if used later)
- **Routing:** React Router
- **Authentication:** JWT-based authentication (with cookies)
- **Backend Communication:** REST API (Flask-based backend)

## Project Structure
```
frontend/
│── public/              # Static assets (favicon, logo, index.html)
│── src/
│   ├── assets/         # Images, icons, and other static resources
│   ├── components/     # Reusable UI components (Navbar, Footer, Buttons)
│   ├── pages/          # Page-level components (Home, Login, Profile, Chatbot)
│   ├── App.js          # Main application entry point
│   ├── App.css         # Global styles
│── package.json        # Dependencies and scripts
│── tailwind.config.js  # Tailwind CSS configuration
│── .env                # Environment variables (API URLs, secrets)
```

## Features
- **User Authentication** (Login, Register, Forgot Password)
- **Chatbot Integration** (AI-powered mental wellness assistant)
- **Self-care Tools** (Breathing exercises, meditation, and therapy plans)
- **Responsive UI** with Tailwind CSS
- **Dark Mode Support** (if implemented)
- **Secure API Communication** (JWT token authentication via cookies)

## Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/smitngandhi/Team-45_Mitra.git
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables
Create a `.env` file in the root directory and define:
```
REACT_APP_API_BASE_URL=http://127.0.0.1:5000/api/v1
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## API Endpoints Used
- **User Authentication:**
  - `POST /api/v1/login`
  - `POST /api/v1/register`



## Contributing
1. Create a new branch: `git checkout -b feature-name`
2. Make changes and commit: `git commit -m 'Added new feature'`
3. Push to GitHub: `git push origin feature-name`
4. Open a pull request

## Maintainers
- **Smit Gandhi** (Backend & Authentication)
- **Dhruvil** (Backend APIs)
- **Prachi** (UI/UX & Chatbot Fine-Tuning)
- **Manan** (Frontend Development & Cloud Integration)

---
📌 *MITRA - AI Mental Wellness Assistant | Built with ❤️ by Team 45*




