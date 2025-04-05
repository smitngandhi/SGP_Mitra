import React, { useState, useEffect, useRef } from 'react';
import '../Chatbot.css';
import '../Profile.css';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from "rehype-raw";

import personheart from '../assets/personheart.svg'
import person from '../assets/person.svg'
import house from '../assets/house.svg'
import freepeek from '../assets/freepeek.jpeg'
import chat from '../assets/chat.svg'
import arrow1 from '../assets/arrow1.svg'
import test from "../assets/pencil-fill.svg"
import question from "../assets/question-circle.svg"
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';

function HappinessMeter({ value, onChange }) {
  const radius = 80;      // Radius for the arc
  const centerX = 150;    // Horizontal center of the SVG
  const centerY = 100;    // Vertical center (adjusted for height)
  // Map value (0..1) to an angle in radians:
  // value = 0 => angle = π (left end); value = 1 => angle = 0 (right end)
  const angle = (1 - value) * Math.PI;
  // Calculate knob position on the arc
  const knobX = centerX + radius * Math.cos(angle);
  const knobY = centerY - radius * Math.sin(angle);

  // Determine label text based on value
  let label = 'Okay';
  if (value < 0.33) label = 'Bad';
  else if (value > 0.66) label = 'Good';

  const [dragging, setDragging] = useState(false);
  const [animateKnob, setAnimateKnob] = useState(false);

  // Handle dragging: update value based on mouse position relative to center
  const handleMouseMove = (e) => {
    if (!dragging) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // Calculate mouse position within SVG
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - centerX;
    const dy = centerY - y; // invert y axis so upward is positive
    let theta = Math.atan2(dy, dx);
    // Clamp theta to [0, π] (only allow movement along the semicircle)
    if (theta < 0) theta = 0;
    if (theta > Math.PI) theta = Math.PI;
    // Convert theta to value: value = 1 - (theta / π)
    const newValue = 1 - theta / Math.PI;
    onChange(newValue);
  };

  const handleMouseDown = () => {
    setDragging(false);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Animate knob when happiness value changes
  useEffect(() => {
    setAnimateKnob(true);
    const timer = setTimeout(() => setAnimateKnob(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);
 
  return (
    <div className="happiness-meter-container">
      <svg
        width="300"
        height="160"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <linearGradient id="happinessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4D4F" />
            <stop offset="50%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#2ECC71" />
          </linearGradient>
          {/* Add glow effect for animation */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Animated arc */}
        <path
          d="M 70 100 A 80 80 0 0 1 230 100"
          stroke="url(#happinessGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          className="meter-arc"
        />
        {/* Draggable knob with animation */}
        <circle
          cx={knobX}
          cy={knobY}
          r="12"
          fill="#fff"
          stroke={label === 'Bad' ? '#FF4D4F' : label === 'Good' ? '#2ECC71' : '#FFC107'}
          strokeWidth="2"
          onMouseDown={handleMouseDown}
          style={{ cursor: 'not-allowed' }}
        />
        {/* "Happiness Meter" text at top-center */}
        <text
          x="150"
          y="85"
          textAnchor="middle"
          fill="#fff"
          fontSize="15"
          fontWeight="bold"
          className="meter-title"
        >
          Happiness Meter
        </text>
        {/* White label box inside the arc */}
        <rect 
          x="120" 
          y="95" 
          width="60" 
          height="28" 
          rx="6" 
          ry="6" 
          fill="#fff"
          className="meter-label-box" 
        />
        <text
          x="150"
          y="115"
          textAnchor="middle"
          fill={label === 'Bad' ? '#FF4D4F' : label === 'Good' ? '#2ECC71' : '#FFC107'}
          fontSize="14"
          fontWeight="bold"
          className="meter-label-text"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

function Chatbot() {
  const [cookies] = useCookies(['access_token']);
  // Happiness meter state (0 to 1)
  const [happiness, setHappiness] = useState(0.5);
  // Animation states
  const [isLoading, setIsLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Sidebar navigation items
  const navItems = [
    { icon: chat, label: 'MindChat', path: '/chatbot'},
        { icon: test, label: 'Self Test ', path: '/test'},
        { icon: personheart, label: 'SelfCare Plans', path: '/selfcare'},
        { icon: question, label: 'FAQs', path: '/faqs'},
        { icon: person, label: 'Profile', path: '/profile'},    
        { icon: house, label: 'Home', path: '/home'},
  ];

  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    // Trigger welcome animation on first load
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Send a message and simulate a dummy AI response
  const handleSend = async () => {
    if (!userInput.trim()) return;

    const message = userInput.trim();
    const accessToken = cookies.access_token || null;

    // Set loading state for animation
    setIsLoading(true);
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 500);

    // Add user message to chat
    setMessages([...messages, { role: 'user', text: message, isNew: true }]);
    setUserInput('');

    console.log(message);
    console.log(accessToken);

    try {
        const response = await fetch("http://127.0.0.1:5000/api/v1/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: message,
                access_token: accessToken, // Passing token as in your format
            }),
        });

        const data = await response.json();
        console.log(data);

        // Short delay to show typing animation
        setTimeout(() => {
            if (response.ok) {
                setMessages((prev) => {
                    // Remove isNew flag from previous messages
                    const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
                    return [...updatedPrev, {
                        role: 'ai',
                        text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.reply}</ReactMarkdown>,
                        isNew: true
                    }];
                });

                // Update Happiness Meter based on sentiment score
                if (data.sentiment_score !== undefined) {
                    setHappiness(data.sentiment_score);
                }
            } else {
                console.error("API Error:", data.msg || "No response from API.");
                setMessages((prev) => {
                    const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
                    return [...updatedPrev, { role: 'ai', text: 'Error communicating with AI.', isNew: true }];
                });
            }
            setIsLoading(false);
        }, 1000);

    } catch (error) {
        console.error("Unexpected error:", error);
        setTimeout(() => {
            setMessages((prev) => {
                const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
                return [...updatedPrev, { role: 'ai', text: 'Error connecting to the server.', isNew: true }];
            });
            setIsLoading(false);
        }, 1000);
    }
};

  // Auto-scroll to bottom when messages update
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Remove the 'isNew' flag after animation completes
    const timer = setTimeout(() => {
      setMessages(messages.map(msg => ({...msg, isNew: false})));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [messages]);

  // Send on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // 4 suggestion strings
  const suggestions = [
    'I am having relationship issues',
    'I am so happy today',
    'I am anxious today',
    'I am bored',
  ];

  // On suggestion click => skip input; directly add user message & AI reply
  const handleSuggestionClick = async (suggestion) => {
    if (!suggestion.trim()) return;

    const accessToken = cookies.access_token || null;

    // Set loading state for animation
    setIsLoading(true);

    // Add suggestion as user message
    setMessages((prev) => {
      const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
      return [...updatedPrev, { role: 'user', text: suggestion, isNew: true }];
    });
    
    console.log(suggestion);
    console.log(accessToken);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: suggestion, 
          access_token: accessToken, 
        }),
      });

      const data = await response.json();
      console.log(data);
      
      // Short delay to show typing animation
      setTimeout(() => {
        if (response.ok) {
          setMessages((prev) => {
            const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
            return [...updatedPrev, { role: 'ai', text: data.reply, isNew: true }];
          });

          // Update Happiness Meter based on sentiment score
          if (data.sentiment_score !== undefined) {
            setHappiness(data.sentiment_score);
          }
        } else {
          console.error("API Error:", data.msg || "No response from API.");
          setMessages((prev) => {
            const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
            return [...updatedPrev, { role: 'ai', text: 'Error communicating with AI.', isNew: true }];
          });
        }
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Unexpected error:", error);
      setTimeout(() => {
        setMessages((prev) => {
          const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
          return [...updatedPrev, { role: 'ai', text: 'Error connecting to the server.', isNew: true }];
        });
        setIsLoading(false);
      }, 1000);
    }
  };

  const hasMessages = messages.length > 0;
 
  const navigate = useNavigate();
  
        
  
  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <h2 className="Mitra">MITRA</h2>
        <nav>
          <ul>
            {navItems.map((item, idx) => (
              <li 
                key={idx} 
                className="nav-item" 
                onClick={() => navigate(item.path)}
              >
                <img src={item.icon} alt={`${item.label} Logo`} className="menu-logo" />
                {item.label}
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Bottom: Happiness Meter */}
        <div className="sidebar-bottom">
          <HappinessMeter value={happiness} onChange={setHappiness} />
        </div>
      </aside>

      {/* RIGHT CONTAINER */}
      <section className="right-container">
        <header>
          <h2 className="Mindchat">MINDchat</h2>
        </header>

        {!hasMessages ? (
          // HERO CONTAINER (no messages yet)
          <div className={`hero-container ${showWelcome ? 'welcome-animation' : ''}`}>
            <img
              src={freepeek}
              alt="Mitra AI Bot"
              className="center-image hover-bounce"
            />
            <h1 className="hero-title fade-in">
              I'm Mitra, your AI Mental Health Companion
            </h1>
            <p className="hero-subtitle slide-up">
              I'm here to support your emotional health in any way I can!
            </p>
            <div className="ask-input-container">
              <input
                type="text"
                placeholder="Ask me anything ..."
                className="ask-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div 
                className={`send-arrow ${messageSent ? 'send-animation' : ''}`} 
                onClick={handleSend}
              >
                <img src={arrow1} alt="Send" className="arrow-icon" />
              </div>
            </div>

            {/* Suggestion buttons that skip the input and directly send */}
            <div className="suggestions-row">
              {suggestions.map((sugg, i) => (
                <button
                  key={i}
                  className="suggestion-btn"
                  onClick={() => handleSuggestionClick(sugg)}
                  style={{animationDelay: `${i * 0.1}s`}}
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>
        ) : (
          // CHAT CONTAINER (when messages exist)
          <div className="chat-container">
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-bubble ${msg.role === 'user' ? 'user-message' : 'ai-message'} ${msg.isNew ? 'message-new' : ''}`}
                >
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                placeholder="Ask me anything ..."
                className="ask-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div 
                className={`send-arrow ${messageSent ? 'send-animation' : ''}`} 
                onClick={handleSend}
              >
                <img src={arrow1} alt="Send" className="arrow-icon" />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Chatbot;