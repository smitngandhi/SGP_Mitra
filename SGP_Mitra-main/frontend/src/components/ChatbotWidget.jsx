import React, { useState, useRef, useEffect } from 'react';
import { Send, Bell } from 'lucide-react';
import { useCookies } from 'react-cookie';

import { MessageCircle , X , ExternalLink } from 'lucide-react';

export default function ChatbotWidget() {
  const [cookies] = useCookies(['access_token']);
  const [open, setOpen] = useState(false);
  // Add these new state variables after the existing ones
  const [intelligentPromptData, setIntelligentPromptData] = useState(null);
  const [showIntelligentPrompt, setShowIntelligentPrompt] = useState(false);
  const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(true);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm Mitra. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1); 
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(open);
  
  // Recommendation system state
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastRecommendationCheck, setLastRecommendationCheck] = useState(null);
  const [dismissedRecommendations, setDismissedRecommendations] = useState(new Set());
  const [dailyRecommendationCount, setDailyRecommendationCount] = useState(0);
  const [lastRecommendationDate, setLastRecommendationDate] = useState(null);

  // Page metadata for better recommendations
  const pageMetadata = {
    '/': { 
      name: 'Home', 
      category: 'navigation', 
      features: ['platform overview', 'getting started', 'main navigation'],
      description: 'Main landing page with platform introduction'
    },
    '/login': { 
      name: 'Login', 
      category: 'auth', 
      features: ['user authentication', 'secure access'],
      description: 'User authentication portal'
    },
    '/register': { 
      name: 'Register', 
      category: 'auth', 
      features: ['account creation', 'user onboarding'],
      description: 'New user registration'
    },
    '/chat-bot': { 
      name: 'AI Chat', 
      category: 'ai-services', 
      features: ['AI conversation', 'mental health support', 'personalized assistance'],
      description: 'AI-powered mental wellness chatbot'
    },
    '/assessment': { 
      name: 'Mental Health Assessment', 
      category: 'wellness', 
      features: ['psychological evaluation', 'mood tracking', 'wellness insights'],
      description: 'Comprehensive mental health evaluation tools'
    },
    '/music_generation': { 
      name: 'Music Therapy', 
      category: 'wellness', 
      features: ['therapeutic music', 'mood enhancement', 'relaxation'],
      description: 'AI-curated music for mental wellness'
    },
    '/emergency': { 
      name: 'Emergency Support', 
      category: 'crisis', 
      features: ['crisis intervention', '24/7 support', 'immediate help'],
      description: 'Immediate crisis support and emergency resources'
    },
    '/profile': { 
      name: 'User Profile', 
      category: 'account', 
      features: ['personal settings', 'progress tracking', 'preferences'],
      description: 'Personal profile and settings management'
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

  // Initialize frequency controls from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastRecommendationDate');
    const storedCount = parseInt(localStorage.getItem('dailyRecommendationCount') || '0');
    const storedDismissed = JSON.parse(localStorage.getItem('dismissedRecommendations') || '[]');
    
    if (storedDate === today) {
      setDailyRecommendationCount(storedCount);
      setLastRecommendationDate(today);
    } else {
      // Reset daily count for new day
      setDailyRecommendationCount(0);
      setLastRecommendationDate(today);
      localStorage.setItem('dailyRecommendationCount', '0');
      localStorage.setItem('lastRecommendationDate', today);
    }
    
    setDismissedRecommendations(new Set(storedDismissed));
  }, []);

  // 5-minute interval recommendation checking with frequency controls
  useEffect(() => {
    // Initial check after 30 seconds
    const initialTimer = setTimeout(() => {
      checkForRecommendations();
    }, 30000);

    // Set up 5-minute interval
    const intervalTimer = setInterval(() => {
      const now = Date.now();
      // Only check if last check was more than 5 minutes ago and within daily limits
      if (!lastRecommendationCheck || (now - lastRecommendationCheck) >= 300000) {
        checkForRecommendations();
      }
    }, 300000); // 5 minutes = 300,000ms

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [lastRecommendationCheck]);



  // Fetch intelligent recommendation with auto-generated prompts
  const getIntelligentRecommendation = async () => {
    try {
      console.log('Fetching intelligent recommendation...');
      if (!cookies.access_token) {
        console.warn('No access token found for intelligent recommendation');
        return null;
      }

      const response = await fetch('http://13.211.214.231/api/v1/tracking/intelligent-recommendation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: cookies.access_token
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.shouldRecommend && data.intelligentPrompt) {
          return {
            page: data.page,
            targetPage: data.targetPage || data.page,
            intelligentPrompt: data.intelligentPrompt,
            confidence: data.confidence,
            totalTime: data.totalTime,
            visitCount: data.visitCount
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting intelligent recommendation:', error);
      return null;
    }
  };


    // Handle intelligent prompt acceptance
  const handleIntelligentPromptAccept = async () => {
    if (intelligentPromptData) {
      const { targetPage, intelligentPrompt } = intelligentPromptData;
      
      await logRecommendationEvent('intelligent_prompt_accepted', {
        page: targetPage,
        prompt: intelligentPrompt,
        confidence: intelligentPromptData.confidence
      });
      
      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Perfect! Taking you to ${targetPage} with a personalized prompt...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
      // Navigate with intelligent prompt
      const encodedPrompt = encodeURIComponent(intelligentPrompt);
      const autoSubmitParam = autoSubmitEnabled ? '&autoSubmit=true' : '';
      
      setTimeout(() => {
        if (targetPage.includes('/chat') || targetPage.includes('/chatbot')) {
          window.location.href = `/chat-bot?prompt=${encodedPrompt}${autoSubmitParam}`;
        } else if (targetPage.includes('/music')) {
          window.location.href = `/music_generation?prompt=${encodedPrompt}${autoSubmitParam}`;
        } else {
          window.location.href = targetPage;
        }
      }, 1000);
      
      setShowIntelligentPrompt(false);
      setIntelligentPromptData(null);
    }
  };

  // Handle intelligent prompt dismissal
  const handleIntelligentPromptDismiss = async () => {
    if (intelligentPromptData) {
      await logRecommendationEvent('intelligent_prompt_dismissed', {
        page: intelligentPromptData.targetPage,
        prompt: intelligentPromptData.intelligentPrompt
      });
      
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "No problem! I'll keep learning your preferences for better suggestions.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    
    setShowIntelligentPrompt(false);
    setIntelligentPromptData(null);
  };

  // Fetch user tracking data from MongoDB using JWT
  const fetchUserTrackingData = async () => {
    try {
      if (!cookies.access_token) {
        console.warn('No access token found in cookies');
        return [];
      }
      console.log("Access token found in cookies" , cookies.access_token);
      const response = await fetch('http://13.211.214.231/api/v1/tracking/user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: cookies.access_token
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Tracking request successful! User data retrieved:", data.user_visits?.length || 0, "visit groups");
        
        // Show success notification
        setMessages(prev => [...prev, {
          sender: "bot",
          text: "📊 Successfully retrieved your activity data for personalized recommendations!",
          isSystemMessage: true
        }]);
        
        return data.user_visits || [];
      } else if (response.status === 404) {
        // New user - no tracking data yet
        console.log("ℹ️ New user - no tracking data available yet");
        return [];
      } else {
        console.warn(`Tracking API returned ${response.status}: ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      // Show user-friendly message in chat
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I'm having trouble accessing your usage data right now. Recommendations will be available once the connection is restored.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return [];
    }
  };

  // Analyze user behavior and generate recommendation
  const analyzeUserBehavior = async (userVisits) => {
    if (!userVisits || userVisits.length === 0) {
      return { shouldRecommend: false, message: "Getting to know your preferences. Keep exploring!" };
    }

    // Calculate total time spent per page
    const pageTimeMap = {};
    
    userVisits.forEach(visitGroup => {
      visitGroup.visits.forEach(visit => {
        const page = visit.page;
        const timeSpent = parseFloat(visit.timeSpent.replace(' seconds', '')) || 0;
        
        if (!pageTimeMap[page]) {
          pageTimeMap[page] = { totalTime: 0, visitCount: 0 };
        }
        pageTimeMap[page].totalTime += timeSpent;
        pageTimeMap[page].visitCount += 1;
      });
    });

    // Find page with most total time spent
    let recommendedPage = null;
    let maxTime = 0;
    
    Object.entries(pageTimeMap).forEach(([page, data]) => {
      if (data.totalTime > maxTime && page !== window.location.pathname) {
        maxTime = data.totalTime;
        recommendedPage = page;
      }
    });

    if (!recommendedPage || maxTime < 5) { // Minimum 5 seconds threshold
      return { shouldRecommend: false, message: "Continue exploring to get personalized recommendations!" };
    }

    return {
      shouldRecommend: true,
      page: recommendedPage,
      totalTime: maxTime,
      visitCount: pageTimeMap[recommendedPage].visitCount
    };
  };

  // Generate recommendation explanation using LLM with page metadata
  const generateRecommendationExplanation = async (page, totalTime, visitCount) => {
    try {
      const metadata = pageMetadata[page] || { 
        name: page, 
        features: ['various features'], 
        description: 'useful content' 
      };
      
      const contextualPrompt = `Generate a brief, friendly recommendation for the "${metadata.name}" page. 
      User spent ${totalTime.toFixed(1)} seconds across ${visitCount} visits. 
      Page features: ${metadata.features.join(', ')}. 
      Description: ${metadata.description}.
      Keep it under 40 words and focus on value proposition.`;

      const response = await fetch("http://13.211.214.231/api/v1/blob/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextualPrompt }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.reply || `${metadata.name} offers ${metadata.features[0]} - you've engaged ${visitCount} times for ${totalTime.toFixed(1)}s total!`;
      }
      
      // Fallback with metadata
      return `${metadata.name} offers ${metadata.features.slice(0, 2).join(' and ')} - worth revisiting based on your ${visitCount} previous visits!`;
    } catch (error) {
      const metadata = pageMetadata[page];
      return metadata ? 
        `${metadata.name} has been valuable to you before - ${metadata.features[0]} might be useful again!` :
        `Based on your usage patterns, this page might interest you again!`;
    }
  };

  // Log recommendation analytics with JWT
  const logRecommendationEvent = async (eventType, data) => {
    try {
      if (!cookies.access_token) {
        console.warn('No access token found for logging recommendation event');
        return;
      }
      
      await fetch('http://13.211.214.231/api/v1/tracking/recommendation-event', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: cookies.access_token,
          eventType,
          timestamp: new Date().toISOString(),
          data
        })
      });
    } catch (error) {
      console.warn('Failed to log recommendation event:', error);
    }
  };

  // Check if recommendation should be shown based on frequency controls
  const shouldShowRecommendation = (page) => {
    const MAX_DAILY_RECOMMENDATIONS = 3;
    const today = new Date().toDateString();
    
    // Check daily limit
    if (dailyRecommendationCount >= MAX_DAILY_RECOMMENDATIONS) {
      return { allowed: false, reason: 'Daily limit reached' };
    }
    
    // Check if page was recently dismissed
    if (dismissedRecommendations.has(page)) {
      return { allowed: false, reason: 'Recently dismissed' };
    }
    
    // Check if user is currently on the recommended page
    if (window.location.pathname === page) {
      return { allowed: false, reason: 'Currently on page' };
    }
    
    return { allowed: true, reason: 'Allowed' };
  };

  // Main recommendation checking function
  const checkForRecommendations = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    const startTime = Date.now();
    
    try {

      const intelligentRec = await getIntelligentRecommendation();
    
      if (intelligentRec) {
        setIntelligentPromptData(intelligentRec);
        setShowIntelligentPrompt(true);
        setLastRecommendationCheck(Date.now());
        
        // Update daily count
        const newCount = dailyRecommendationCount + 1;
        setDailyRecommendationCount(newCount);
        localStorage.setItem('dailyRecommendationCount', newCount.toString());
        
        // Show intelligent recommendation message
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🤖 **Smart Recommendation Ready!**\n\nI've prepared a personalized prompt for ${intelligentRec.targetPage}:\n\n"${intelligentRec.intelligentPrompt}"\n\n*Based on your conversation history and preferences.*`,
            isIntelligentRecommendation: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        setUnreadCount(prev => prev + 1);
        setIsAnalyzing(false);
        return; // Exit early since we found intelligent recommendation
      }
      const userVisits = await fetchUserTrackingData();
      const analysis = await analyzeUserBehavior(userVisits);
      
      // Log analysis completion
      await logRecommendationEvent('analysis_completed', {
        totalVisits: userVisits.length,
        shouldRecommend: analysis.shouldRecommend,
        analysisTime: Date.now() - startTime,
        dailyCount: dailyRecommendationCount
      });
      
      if (analysis.shouldRecommend) {
        // Check frequency controls
        const frequencyCheck = shouldShowRecommendation(analysis.page);
        
        if (!frequencyCheck.allowed) {
          await logRecommendationEvent('recommendation_blocked', {
            page: analysis.page,
            reason: frequencyCheck.reason,
            dailyCount: dailyRecommendationCount
          });
          return;
        }
        
        const explanation = await generateRecommendationExplanation(
          analysis.page, 
          analysis.totalTime, 
          analysis.visitCount
        );
        
        const recommendationData = {
          page: analysis.page,
          explanation: explanation,
          totalTime: analysis.totalTime,
          visitCount: analysis.visitCount,
          generatedAt: new Date().toISOString()
        };
        
        setRecommendationData(recommendationData);
        setShowRecommendation(true);
        setLastRecommendationCheck(Date.now());
        
        // Update daily count
        const newCount = dailyRecommendationCount + 1;
        setDailyRecommendationCount(newCount);
        localStorage.setItem('dailyRecommendationCount', newCount.toString());
        
        // Log recommendation shown
        await logRecommendationEvent('recommendation_shown', {
          ...recommendationData,
          dailyCount: newCount
        });
        
        // Show recommendation notification in chat
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `🎯 **New Recommendation Available!**\n\n${explanation}\n\n*Based on your usage patterns and preferences.*`,
            isRecommendation: true,
            recommendationData: {
              page: analysis.page,
              explanation,
              confidence: 'High'
            }
          }
        ]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('Mitra - New Recommendation!', {
            body: `We found a personalized suggestion for you: ${analysis.page}`,
            icon: '/favicon.ico',
            tag: 'mitra-recommendation'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Mitra - New Recommendation!', {
                body: `We found a personalized suggestion for you: ${analysis.page}`,
                icon: '/favicon.ico',
                tag: 'mitra-recommendation'
              });
            }
          });
        }

        // Visual notification badge on chatbot widget
        setUnreadCount(prev => prev + 1);
      } else {
        // Log no recommendation
        await logRecommendationEvent('no_recommendation', { reason: analysis.message });
      }
    } catch (error) {
      console.error('Recommendation check failed:', error);
      await logRecommendationEvent('error', { error: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch response from Flask API
  const fetchChatbotResponse = async (message) => {
    setIsLoading(true);

    try {
      const response = await fetch("http://13.211.214.231/api/v1/blob/chat", {
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

  // Handle recommendation acceptance and navigation
  const handleRecommendationAccept = async () => {
    if (recommendationData?.page) {
      // Log recommendation acceptance
      await logRecommendationEvent('recommendation_accepted', {
        page: recommendationData.page,
        totalTime: recommendationData.totalTime,
        visitCount: recommendationData.visitCount
      });
      
      // Add confirmation message to chat
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Great! Taking you to ${recommendationData.page}... 🚀`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
      // Navigate to the recommended page
      setTimeout(() => {
        window.location.href = recommendationData.page;
      }, 1000);
      
      setShowRecommendation(false);
      setRecommendationData(null);
    }
  };

  // Handle recommendation dismissal
  const handleRecommendationDismiss = async () => {
    if (recommendationData?.page) {
      // Add to dismissed recommendations (temporary block for this session)
      const newDismissed = new Set(dismissedRecommendations);
      newDismissed.add(recommendationData.page);
      setDismissedRecommendations(newDismissed);
      
      // Store in localStorage (expires after 2 hours)
      const dismissedArray = Array.from(newDismissed);
      localStorage.setItem('dismissedRecommendations', JSON.stringify(dismissedArray));
      
      // Clear dismissed recommendations after 2 hours
      setTimeout(() => {
        const currentDismissed = new Set(JSON.parse(localStorage.getItem('dismissedRecommendations') || '[]'));
        currentDismissed.delete(recommendationData.page);
        localStorage.setItem('dismissedRecommendations', JSON.stringify(Array.from(currentDismissed)));
      }, 2 * 60 * 60 * 1000); // 2 hours
      
      await logRecommendationEvent('recommendation_dismissed', {
        page: recommendationData.page,
        totalTime: recommendationData.totalTime,
        visitCount: recommendationData.visitCount,
        dailyCount: dailyRecommendationCount
      });
      
      // Add feedback message
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Got it! I won't recommend that page again for a while. Your preferences help me learn! 📚",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    setShowRecommendation(false);
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
              {isAnalyzing && (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={checkForRecommendations}
                disabled={isAnalyzing}
                className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-all duration-200 disabled:opacity-50"
                title="Check for recommendations"
              >
                <Bell size={16} />
              </button>
              <button 
                onClick={() => setOpen(false)}
                className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
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
                  
                  {/* Recommendation popup */}
                  {(showRecommendation || showIntelligentPrompt) &&
                  (recommendationData || intelligentPromptData) &&
                  msg.sender === "bot" && 
                  i === messages.length - 1 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Bell className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          {showIntelligentPrompt && intelligentPromptData ? (
                            // Intelligent Prompt UI
                            <>
                              <h4 className="text-sm font-semibold text-purple-800 mb-1">
                                🤖 Intelligent Recommendation
                              </h4>
                              <p className="text-xs text-gray-700 mb-2">
                                Ready to continue with: <span className="font-mono bg-purple-100 px-1 rounded">{intelligentPromptData.targetPage}</span>
                              </p>
                              <div className="text-xs bg-gray-50 p-2 rounded mb-2 border-l-3 border-purple-400">
                                <strong>Pre-filled prompt:</strong> "{intelligentPromptData.intelligentPrompt}"
                              </div>
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id="autoSubmit"
                                  checked={autoSubmitEnabled}
                                  onChange={(e) => setAutoSubmitEnabled(e.target.checked)}
                                  className="mr-2 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="autoSubmit" className="text-xs text-gray-600">
                                  Auto-submit prompt (recommended)
                                </label>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleIntelligentPromptAccept}
                                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors flex items-center space-x-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Go & Fill</span>
                                </button>
                                <button
                                  onClick={handleIntelligentPromptDismiss}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition-colors"
                                >
                                  Not Now
                                </button>
                              </div>
                            </>
                          ) : showRecommendation && recommendationData ? (
                            // Regular Recommendation UI
                            <>
                              <h4 className="text-sm font-semibold text-purple-800 mb-1">
                                💡 Smart Recommendation
                              </h4>
                              <p className="text-xs text-gray-700 mb-2">
                                {recommendationData.explanation}
                              </p>
                              <p className="text-xs text-purple-600 mb-3">
                                Visit: <span className="font-mono bg-purple-100 px-1 rounded">{recommendationData.page}</span>
                              </p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleRecommendationAccept}
                                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full hover:bg-purple-700 transition-colors flex items-center space-x-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Go There</span>
                                </button>
                                <button
                                  onClick={handleRecommendationDismiss}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full hover:bg-gray-300 transition-colors"
                                >
                                  Maybe Later
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                }
                  
                  
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