import React, { useState, useEffect, useRef } from 'react';

import { MessageCircle, X, Send, Bell, ExternalLink } from 'lucide-react';
import '../ChatbotWidget.css';
import { autoFillHandler } from '../utils/autoFillHandler';
import { useCookies } from 'react-cookie';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm Mitra. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1); 
  const [hasRecommendation, setHasRecommendation] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [cookies] = useCookies(['access_token']);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(open);

  // Decode JWT token to get user email
  const getUserEmail = () => {
    const access_token = cookies.access_token;
    if (!access_token) {
      console.log('No access_token present');
      return null;
    }
    
    try {
      // Simple JWT decode (for payload only, not verification)
      const base64Url = access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded_token = JSON.parse(jsonPayload);
      return decoded_token.sub; // 'sub' is the standard JWT claim for subject (user email)
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Keep ref in sync with open state
  useEffect(() => {
    isOpenRef.current = open;
  }, [open]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync localStorage tracking data and check for recommendations
  useEffect(() => {
    syncTrackingData();
    checkForRecommendations();
    
    // Check for recommendations every 30 seconds
    const recommendationInterval = setInterval(checkForRecommendations, 30000);
    return () => clearInterval(recommendationInterval);
  }, []);

  const syncTrackingData = async () => {
    try {
      const userEmail = getUserEmail();
      if (!userEmail) {
        console.log('No access_token present - cannot sync tracking data');
        return;
      }
      
      const pageTracking = JSON.parse(localStorage.getItem('pageTracking') || '{}');
      
      if (Object.keys(pageTracking).length > 0) {
        const response = await fetch('http://localhost:5000/api/v1/sync-tracking-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            email: userEmail,
            pageTracking 
          })
        });
        
        if (response.ok) {
          console.log('Tracking data synced successfully');
          // Clear localStorage after successful sync
          localStorage.removeItem('pageTracking');
        }
      }
    } catch (error) {
      console.error('Failed to sync tracking data:', error);
    }
  };

  const checkForRecommendations = async () => {
    try {
      const userEmail = getUserEmail();
      console.log(userEmail);
      if (!userEmail) {
        console.log('No access_token present - not generating recommendation');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/v1/get-recommendation?email=${userEmail}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.has_recommendation && data.recommendation) {
        setHasRecommendation(true);
        setCurrentRecommendation(data.recommendation);
        
        // Add recommendation as a bot message
        const recommendationMessage = {
          sender: "bot",
          text: `🎯 **Smart Recommendation for You**\n\n**${data.recommendation.page_display_name}**\n\n${data.recommendation.message}\n\n**✨ Features:** ${data.recommendation.features}\n\n**🤔 Why this suggestion:** ${data.recommendation.reasoning}\n\n*Click "Take me there!" and I'll automatically set everything up for you.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRecommendation: true,
          recommendationData: data.recommendation
        };
        
        setMessages(prev => {
          // Check if recommendation already exists
          const hasExistingRec = prev.some(msg => msg.isRecommendation);
          if (!hasExistingRec) {
            // Increment unread count if widget is closed
            if (!isOpenRef.current) {
              setUnreadCount(prevCount => prevCount + 1);
            }
            return [...prev, recommendationMessage];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to check for recommendations:', error);
    }
  };

  const handleRecommendationAction = async (action, recommendationData) => {
    try {
      if (action === 'accept') {
        // Mark recommendation as accepted
        const userEmail = getUserEmail();

        if (!userEmail) {
          console.log('No access_token present - cannot accept recommendation');
          return;
        }
        
        await fetch('http://localhost:5000/api/v1/accept-recommendation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: userEmail
          })
        });
        
        // Navigate to recommended page with automatic input filling
        if (recommendationData.frontend_url) {
          const targetPage = recommendationData.page || recommendationData.recommended_page;
          
          // Store input data for automatic filling
          const inputData = getAutoFillData(targetPage, recommendationData);
          if (inputData) {
            localStorage.setItem('autoFillData', JSON.stringify(inputData));
          }
          
          // Navigate to the page
          window.location.href = recommendationData.frontend_url;
        }
      }
      
      // Clear recommendation state
      setHasRecommendation(false);
      setCurrentRecommendation(null);
      
    } catch (error) {
      console.error('Failed to handle recommendation action:', error);
    }
  };

  const getAutoFillData = (targetPage, recommendationData) => {
    const autoFillMap = {
      '/music_generation': {
        inputField: 'prompt',
        value: `Generate music based on my current mood and preferences. I'm interested in ${recommendationData.features || 'therapeutic music'}.`,
        placeholder: 'Describe the type of music you want to generate...',
        focusDelay: 1000
      },
      '/chat-bot': {
        inputField: 'message',
        value: `Hi! I was recommended to try ${recommendationData.page_display_name}. ${recommendationData.reasoning || 'Can you help me get started?'}`,
        placeholder: 'Type your message...',
        focusDelay: 1000
      },
      '/assessment': {
        inputField: null, // No input field, just navigation
        action: 'scroll_to_assessment',
        message: 'Ready to begin your assessment'
      },
      '/selfcare': {
        inputField: null,
        action: 'highlight_features',
        message: 'Explore your wellness insights'
      }
    };
    
    return autoFillMap[targetPage] || null;
  };

  // Fetch response from Flask API
  const fetchChatbotResponse = async (message) => {
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/blob/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      setTimeout(() => {
        if (response.ok) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
          ]);
          // Increment unread count if widget is closed
          if (!isOpenRef.current) {
            setUnreadCount(prev => prev + 1);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "Sorry, I had trouble understanding that. Can you try again?",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
          ]);
          // Increment unread count if widget is closed
          if (!isOpenRef.current) {
            setUnreadCount(prev => prev + 1);
          }
        }
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Error: Unable to connect to server.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
      // Increment unread count if widget is closed
      if (!isOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { 
      sender: "user", 
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    fetchChatbotResponse(input);

    setInput("");
  };

  const formatMessage = (text) => {
    if (typeof text !== 'string') return text;
    
    // Handle markdown-like formatting
    const formatText = (str) => {
      // Bold text: **text** or __text__
      str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      str = str.replace(/__(.*?)__/g, '<strong>$1</strong>');
      
      // Italic text: *text* or _text_
      str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
      str = str.replace(/_(.*?)_/g, '<em>$1</em>');
      
      // Code: `code`
      str = str.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>');
      
      // Links: [text](url)
      str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">$1</a>');
      
      return str;
    };

    return text
      .split('\n')
      .map((line, index) => (
        <div 
          key={index} 
          className={index > 0 ? 'mt-2' : ''}
          dangerouslySetInnerHTML={{ __html: formatText(line) }}
        />
      ));
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating blob button */}
      {!open && (
        <div className="relative">
          <button
            onClick={() => {
              setOpen(true);
              setUnreadCount(0); // Clear notifications when opening chat
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] shadow-2xl flex items-center justify-center text-white hover:shadow-3xl hover:scale-105 transition-all duration-300 animate-pulse"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            <MessageCircle size={28} />
          </button>
          
          {/* Notification badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div
          className="w-80 h-96 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden transform transition-all duration-300 border border-gray-200"
          style={{
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="font-semibold text-white">Mitra Chat</h2>
              {hasRecommendation && (
                <div className="flex items-center gap-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  <Bell size={12} />
                  <span className="text-xs">New recommendation</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl shadow-sm break-words ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] text-white rounded-tr-sm"
                      : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                  }`}
                  style={{
                    animation: `fadeIn 0.3s ease-in-out ${i * 0.1}s both`,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  <div className="text-sm leading-relaxed">
                    {formatMessage(msg.text)}
                  </div>
                  
                  {/* Recommendation action buttons */}
                  {msg.isRecommendation && msg.recommendationData && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleRecommendationAction('accept', msg.recommendationData)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] text-white text-xs rounded-full hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg"
                      >
                        <ExternalLink size={12} />
                        ✨ Take me there!
                      </button>
                      <button
                        onClick={() => handleRecommendationAction('dismiss', msg.recommendationData)}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition-all duration-200"
                      >
                        Maybe later
                      </button>
                    </div>
                  )}
                  
                  {msg.timestamp && (
                    <div className={`text-xs mt-2 opacity-70 ${
                      msg.sender === "user" ? "text-purple-100" : "text-gray-500"
                    }`}>
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Mitra is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-r from-[#965ec7] to-[#7a3fa9] text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}