// API Configuration
const API_CONFIG = {
  // Use relative URLs for production, fallback to localhost for development
  BASE_URL: process.env.REACT_APP_API_URL || '/api/v1',
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:5000',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      GOOGLE_AUTH: '/auth/login/google'
    },
    
    // Chat endpoints
    CHAT: {
      SESSION: '/chat/session',
      SESSIONS: '/chat/sessions',
      SESSIONS_CREATE: '/chat/sessions/create',
      SESSION_BY_ID: (id) => `/chat/sessions/${id}`,
      PIN_SESSION: (id) => `/chat/sessions/${id}/pin`,
      DELETE_SESSION: (id) => `/chat/sessions/${id}`
    },
    
    // User endpoints
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/update',
      DELETE: '/user/delete',
      GET_USERNAME: '/get-username'
    },
    
    // Test endpoints
    TEST: {
      ASSESSMENT: '/test/assessment',
      SUBMIT: '/test/submit'
    },
    
    // Emergency endpoints
    EMERGENCY: {
      CONTACT: '/emergency/contact'
    },
    
    // Tracking endpoints
    TRACKING: {
      USER: '/tracking/user',
      UPDATE: '/tracking/user/update',
      RECOMMENDATION_EVENT: '/tracking/recommendation-event',
      SMART_RECOMMENDATION: '/tracking/smart-recommendation'
    },
    
    // Blob bot endpoints
    BLOB_BOT: {
      CHAT: '/blob-bot/chat'
    }
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use relative URLs (assumes API is served from same domain)
    return API_CONFIG.BASE_URL + endpoint;
  } else {
    // In development, use full backend URL
    return API_CONFIG.BACKEND_URL + API_CONFIG.BASE_URL + endpoint;
  }
};

// Helper function to get backend URL
export const getBackendUrl = () => {
  return API_CONFIG.BACKEND_URL;
};

export default API_CONFIG;
