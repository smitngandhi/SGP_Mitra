/**
 * Auto-fill handler for recommendation navigation
 * Automatically fills input fields when navigating from ChatbotWidget recommendations
 */

export const initializeAutoFill = () => {
  // Check if there's auto-fill data in localStorage
  const autoFillData = localStorage.getItem('autoFillData');
  
  if (autoFillData) {
    try {
      const data = JSON.parse(autoFillData);
      
      // Wait for page to load completely
      setTimeout(() => {
        handleAutoFill(data);
        // Clear the data after use
        localStorage.removeItem('autoFillData');
      }, data.focusDelay || 1000);
      
    } catch (error) {
      console.error('Failed to parse auto-fill data:', error);
      localStorage.removeItem('autoFillData');
    }
  }
};

const handleAutoFill = (data) => {
  const currentPath = window.location.pathname;
  
  switch (currentPath) {
    case '/music_generation':
      handleMusicPageAutoFill(data);
      break;
      
    case '/chat-bot':
      handleChatbotPageAutoFill(data);
      break;
      
    case '/assessment':
      handleAssessmentPageAutoFill(data);
      break;
      
    case '/selfcare':
      handleSelfCarePageAutoFill(data);
      break;
      
    default:
      console.log('Auto-fill not configured for this page:', currentPath);
  }
};

const handleMusicPageAutoFill = (data) => {
  // Look for music generation input fields
  const selectors = [
    'input[placeholder*="music"]',
    'input[placeholder*="prompt"]',
    'input[placeholder*="describe"]',
    'textarea[placeholder*="music"]',
    'textarea[placeholder*="prompt"]',
    '#music-prompt',
    '#prompt-input',
    '.music-input',
    '.prompt-input'
  ];
  
  const inputField = findInputField(selectors);
  
  if (inputField) {
    inputField.value = data.value || "Generate therapeutic music based on my mood and preferences";
    inputField.focus();
    
    // Trigger input events to ensure React state updates
    triggerInputEvents(inputField);
    
    // Show success message
    showAutoFillNotification('🎵 Music prompt filled automatically!');
  } else {
    console.warn('Music generation input field not found');
  }
};

const handleChatbotPageAutoFill = (data) => {
  // Look for chatbot input fields
  const selectors = [
    'input[placeholder*="message"]',
    'input[placeholder*="chat"]',
    'input[placeholder*="type"]',
    'textarea[placeholder*="message"]',
    '#chat-input',
    '#message-input',
    '.chat-input',
    '.message-input'
  ];
  
  const inputField = findInputField(selectors);
  
  if (inputField) {
    inputField.value = data.value || "Hi! I was recommended to try this feature. Can you help me get started?";
    inputField.focus();
    
    // Trigger input events
    triggerInputEvents(inputField);
    
    // Show success message
    showAutoFillNotification('💬 Chat message filled automatically!');
  } else {
    console.warn('Chatbot input field not found');
  }
};

const handleAssessmentPageAutoFill = (data) => {
  // For assessment page, scroll to the main assessment section
  const assessmentSection = document.querySelector('.assessment-container, .test-container, #assessment-section');
  
  if (assessmentSection) {
    assessmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showAutoFillNotification('📋 Ready to begin your assessment!');
  }
  
  // Highlight the start button if available
  const startButton = document.querySelector('button[class*="start"], button[class*="begin"], .start-assessment');
  if (startButton) {
    startButton.classList.add('highlight-button');
    setTimeout(() => {
      startButton.classList.remove('highlight-button');
    }, 3000);
  }
};

const handleSelfCarePageAutoFill = (data) => {
  // For selfcare page, highlight key features
  const featureSections = document.querySelectorAll('.feature-card, .insight-card, .wellness-card');
  
  if (featureSections.length > 0) {
    featureSections.forEach((section, index) => {
      setTimeout(() => {
        section.classList.add('highlight-feature');
        setTimeout(() => {
          section.classList.remove('highlight-feature');
        }, 2000);
      }, index * 500);
    });
    
    showAutoFillNotification('🌟 Explore your wellness insights!');
  }
};

const findInputField = (selectors) => {
  for (const selector of selectors) {
    const field = document.querySelector(selector);
    if (field && !field.disabled && !field.readOnly) {
      return field;
    }
  }
  return null;
};

const triggerInputEvents = (inputField) => {
  // Trigger various events to ensure React components update
  const events = ['input', 'change', 'keyup', 'focus'];
  
  events.forEach(eventType => {
    const event = new Event(eventType, { bubbles: true });
    inputField.dispatchEvent(event);
  });
};

const showAutoFillNotification = (message) => {
  // Create a temporary notification
  const notification = document.createElement('div');
  notification.className = 'auto-fill-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #965ec7, #7a3fa9);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(150, 94, 199, 0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .highlight-button {
      animation: pulse 1s infinite;
      box-shadow: 0 0 20px rgba(150, 94, 199, 0.5) !important;
    }
    
    .highlight-feature {
      animation: glow 2s ease-in-out;
      transform: scale(1.02);
    }
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 5px rgba(150, 94, 199, 0.3); }
      50% { box-shadow: 0 0 20px rgba(150, 94, 199, 0.6); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(notification);
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
};

// Initialize auto-fill when the module is imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutoFill);
  } else {
    initializeAutoFill();
  }
}
