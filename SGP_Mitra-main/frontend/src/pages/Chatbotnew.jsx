import { useState, useEffect, useRef } from "react";
import MoodDetector from "../components/MoodDetector";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCookies } from 'react-cookie';
import VoiceAssistantModal from "./VoiceAssistantModel";
import voice from "../assets/voice.png";
import recording from "../assets/recording.png";
import send from "../assets/send.png";
import sendhover from "../assets/sendhover.png";
import sendSound from "../assets/sendmsg.mp3";
import receiveSound from "../assets/receivemsg.mp3";
import {
  Send,
  Mic,
  Bot,
  User,
  Pin,
  Search,
  Settings,
  Plus,
  MessageCircle
} from 'lucide-react';

const Chatbotnew = () => {
  const [cookies] = useCookies(['access_token']);
  const [sentiment, setSentiment] = useState(0.5);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sample chat history data
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: "Stress Management Session",
      preview: "I'm feeling really stressed about work lately and need some coping strategies...",
      timestamp: "2 hours ago",
      pinned: true,
      messages: []
    },
    {
      id: 2,
      title: "Sleep Better Discussion",
      preview: "Can you help me improve my sleep quality? I've been having trouble falling asleep.",
      timestamp: "Yesterday",
      pinned: false,
      messages: []
    },
    {
      id: 3,
      title: "Mood Boost Ideas",
      preview: "I need some quick ways to improve my mood when I'm feeling down.",
      timestamp: "3 days ago",
      pinned: false,
      messages: []
    }
  ]);

  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const suggestionOptions = [
    { text: "I'm feeling stressed today", icon: "🧠" },
    { text: "Help me sleep better", icon: "🌙" },
    { text: "Quick mood boost ideas", icon: "✨" },
    { text: "Mindfulness exercises", icon: "💜" }
  ];

  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleMouseEnter = () => {
    setIsRecording(true);
  };

  const handleMouseLeave = () => {
    setIsRecording(false);
  };

  const handleMouseEntersend = () => {
    setIsSending(true);
  };

  const handleMouseLeavesend = () => {
    setIsSending(false);
  };

  const playSound = (sound) => {
    try {
      const audio = new Audio(sound);
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Sound playback error:', error);
    }
  };

  const handleSendClick = (e) => {
    handleSubmit(e);
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
    }, 500);
  };

  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const timer = setTimeout(() => {
      setMessages(messages.map(msg => ({ ...msg, isNew: false })));
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, isUserScrolling]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;

    setIsUserScrolling(!isAtBottom);

    if (isAtBottom) {
      setIsUserScrolling(false);
    }
  };

  const fetchChatbotResponse = async (message) => {
    const accessToken = cookies.access_token || null;
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          access_token: accessToken,
        }),
      });

      const data = await response.json();
      setTimeout(() => {
        if (response.ok) {
          setMessages(prev => {
            const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
            return [...updatedPrev, {
              role: 'ai',
              text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.reply}</ReactMarkdown>,
              isNew: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }];
          });

          setIsUserScrolling(false);

          if (data.sentiment_score !== undefined) {
            setSentiment(data.sentiment_score);
          }

        } else {
          setMessages(prev => {
            const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
            return [...updatedPrev, {
              text: 'Sorry, I had trouble understanding that. Can you try again?',
              sender: "bot",
              isNew: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }];
          });
          setIsUserScrolling(false);
        }
        setIsLoading(false);
      }, 500);
      playSound(receiveSound);

    } catch (error) {
      console.error("Error fetching response:", error);
      setTimeout(() => {
        setMessages(prev => {
          const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
          return [...updatedPrev, {
            text: 'Network error. Please check your connection and try again.',
            sender: "bot",
            isNew: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        });
        setIsUserScrolling(false);
        setIsLoading(false);
      }, 500);
      playSound(receiveSound);
    }
  };

  const handleSubmit = () => {
    if (inputText.trim() === "") return;
    setMessages(prev => {
      const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
      return [...updatedPrev, {
        text: inputText,
        sender: "user",
        isNew: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 500);
    setInputText("");
    setChatStarted(true);
    setIsUserScrolling(false);
    playSound(sendSound);
    fetchChatbotResponse(inputText);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickQuestion = (question) => {
    setMessages(prev => {
      const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
      return [...updatedPrev, {
        text: question,
        sender: "user",
        isNew: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });

    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 500);

    playSound(sendSound)
    setInputText("");
    setChatStarted(true);
    setIsUserScrolling(false);
    fetchChatbotResponse(question);
  };

  const handleVoiceResponse = (reply) => {
    setMessages(prev => {
      const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
      return [...updatedPrev, {
        text: `${reply.user_message || "Voice message"}`,
        sender: "user",
        isNew: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });

    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 500);

    setInputText("");
    setChatStarted(true);
    setIsUserScrolling(false);

    setMessages(prev => {
      const updatedPrev = prev.map(msg => ({ ...msg, isNew: false }));
      return [...updatedPrev, {
        role: 'ai',
        text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.reply}</ReactMarkdown>,
        isNew: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });

    setIsUserScrolling(false);
    setSentiment(reply.sentiment_score);
  };

  const togglePinChat = (chatId) => {
    setChatHistory(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
    ));
  };

  const filteredChats = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChatsList = filteredChats.filter(chat => chat.pinned);
  const recentChatsList = filteredChats.filter(chat => !chat.pinned);

  return (
    <div className="min-h-screen-100% w-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 font-['Inter',sans-serif]">
      {/* Main Layout Container with proper navbar spacing */}
      <div className="h-[calc(100vh-80px)] mt-20 flex overflow-hidden">
        {/* Left Sidebar - Fixed width, scrollable */}
        <div className="w-80 bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 shadow-2xl flex-shrink-0 flex flex-col border-r border-purple-200/30 backdrop-blur-sm">
        {/* User Info Section - Fixed */}
        <div className="p-6 border-b border-purple-200/30 backdrop-blur-sm bg-white/60">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-purple-300/50">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-800 font-semibold text-lg">Welcome back!</h3>
              <p className="text-purple-600 text-sm">MITRA Assistant</p>
            </div>
            <button className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - Fixed */}
        <div className="p-4 border-b border-purple-200/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/70 border border-purple-200/50 rounded-2xl text-gray-700 placeholder-purple-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 focus:bg-white/90 transition-all duration-200 backdrop-blur-sm shadow-inner"
            />
          </div>
        </div>

        {/* Chat List - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Pinned Chats */}
          {pinnedChatsList.length > 0 && (
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Pin className="w-4 h-4 text-purple-500" />
                <h4 className="text-purple-700 text-sm font-semibold uppercase tracking-wide">Pinned</h4>
              </div>
              <div className="space-y-3">
                {pinnedChatsList.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-purple-100 hover:shadow-lg hover:scale-[1.02] hover:ring-2 hover:ring-purple-400/30 ${
                      activeChat?.id === chat.id ? 'bg-purple-100 ring-2 ring-purple-400/50 shadow-lg scale-[1.02]' : 'bg-white/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-gray-800 font-semibold text-sm truncate mb-1">{chat.title}</h5>
                        <p className="text-gray-600 text-xs leading-relaxed overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>{chat.preview}</p>
                        <p className="text-purple-600 text-xs mt-2 font-medium">{chat.timestamp}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinChat(chat.id);
                        }}
                        className="p-1.5 text-purple-500 hover:text-purple-700 transition-colors rounded-md hover:bg-purple-100"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          <div className="px-4 pb-4">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <h4 className="text-purple-700 text-sm font-semibold uppercase tracking-wide">Recent Chats</h4>
            </div>
            <div className="space-y-3">
              {recentChatsList.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-purple-100 hover:shadow-lg hover:scale-[1.02] hover:ring-2 hover:ring-purple-400/30 ${
                    activeChat?.id === chat.id ? 'bg-purple-100 ring-2 ring-purple-400/50 shadow-lg scale-[1.02]' : 'bg-white/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-gray-800 font-semibold text-sm truncate mb-1">{chat.title}</h5>
                      <p className="text-gray-600 text-xs leading-relaxed overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>{chat.preview}</p>
                      <p className="text-purple-600 text-xs mt-2 font-medium">{chat.timestamp}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinChat(chat.id);
                      }}
                      className="p-1.5 text-purple-500 hover:text-purple-700 transition-colors rounded-md hover:bg-purple-100"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mood Bar - Fixed */}
        <div className="p-4 border-t border-purple-200/30 bg-white/60">
          <div className="bg-gradient-to-r from-purple-100/60 to-purple-50/60 rounded-2xl p-4 backdrop-blur-sm shadow-lg">
            <MoodDetector sentiment={sentiment} />
          </div>
        </div>
      </div>

      {/* Main Chat Area - 75-80% width */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50">
        {!chatStarted && !activeChat ? (
          /* Welcome Screen - Centered with proper spacing */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
            {/* MITRA Logo with Gradient Halo */}
            <div className="mb-10 relative">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl ring-4 ring-purple-200/50 relative overflow-hidden">
                {/* Gradient Halo Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-300/30 via-transparent to-purple-600/30 rounded-full animate-pulse"></div>
                <Bot className="w-16 h-16 text-white relative z-10" />
              </div>
              {/* Floating Accent Dots */}
              <div className="w-8 h-8 bg-gradient-to-br from-purple-300 to-purple-400 rounded-full absolute -top-4 -right-4 animate-bounce shadow-lg"></div>
            </div>

            {/* Welcome Text */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent mb-3 leading-tight">
              Welcome to MITRA
            </h1>

            <p className="text-sm text-gray-600 mb-6 max-w-lg leading-relaxed font-medium">
              I'm here to support your emotional health in any way I can. Let's start a conversation about how you're feeling today.
            </p>

            {/* Quick Action Cards - Professional Design */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">How can I help you today?</h2>
                <p className="text-gray-500 text-xs">Choose a topic to start our conversation</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestionOptions.map((option, index) => (
                  <button
                    key={index}
                    className="group relative bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 rounded-lg p-4 w-full transition-all duration-300 hover:shadow-md hover:scale-[1.02] text-left overflow-hidden"
                    onClick={() => handleQuickQuestion(option.text)}
                  >
                    {/* Gradient accent bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                    {/* Card content */}
                    <div className="relative z-10">
                      <div className="flex items-start space-x-2">
                        {/* Icon */}
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <span className="text-sm">{option.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-purple-800 transition-colors duration-300 mb-0 leading-tight">
                            {option.text}
                          </h3>
                          
                        </div>
                      </div>

                      {/* Hover arrow indicator */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-transparent"></div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Additional CTA */}
              <div className="text-center mt-6">
                <p className="text-gray-500 text-xs mb-2">Or start a conversation about anything that's on your mind</p>
                <button onClick={() => setChatStarted(true)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:shadow-md hover:scale-105 text-xs">
                  <span>Start Free Conversation</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <>
            {/* Chat Header - Fixed */}
            <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-purple-100 px-4 py-3 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-purple-200/50">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">{activeChat?.title || 'MITRA Chat'}</h2>
                  <p className="text-xs text-purple-600 font-medium">MITRA Assistant</p>
                </div>
              </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div
              className="flex-1 overflow-y-auto min-h-0"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              <div className="p-4 space-y-4 bg-gradient-to-b from-white/50 via-purple-50/20 to-indigo-50/30 min-h-full">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl shadow-lg ${
                        message.sender === "user"
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-tr-md"
                          : "bg-gradient-to-br from-white to-purple-50 text-purple-900 border border-purple-200/50 rounded-tl-md"
                      }`}
                    >
                      <div className="text-sm leading-relaxed">
                        {typeof message.text === 'string' ? message.text : message.text}
                      </div>
                      <div className={`text-xs mt-3 font-medium ${
                        message.sender === "user" ? "text-purple-100" : "text-purple-500"
                      }`}>
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200/50 p-4 rounded-2xl rounded-tl-md shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-purple-600 font-medium">MITRA is typing...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed */}
            <div className="bg-white/95 backdrop-blur-md border-t border-purple-100 p-6 flex-shrink-0">
              <div className="flex items-end space-x-6 max-w-5xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="w-full px-6 py-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 resize-none transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-lg text-lg"
                    rows={1}
                    style={{ minHeight: '60px', maxHeight: '120px' }}
                  />
                </div>

                <button
                  className={`p-4 rounded-2xl transition-all duration-300 shadow-xl ${
                    isRecording
                      ? 'bg-red-500 text-white scale-110 shadow-red-300'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-105 hover:shadow-purple-300'
                  }`}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setIsVoiceModalOpen(true)}
                >
                  <Mic className="w-6 h-6" />
                </button>

                <button
                  className={`p-4 rounded-2xl transition-all duration-300 shadow-xl ${
                    isSending
                      ? 'bg-gradient-to-br from-purple-600 to-purple-800 scale-110 shadow-purple-300'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-105 hover:shadow-purple-300'
                  }`}
                  onMouseEnter={handleMouseEntersend}
                  onMouseLeave={handleMouseLeavesend}
                  onClick={handleSendClick}
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      </div>

      {/* Floating Chat Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-400/50 hover:scale-110 transition-all duration-300 relative group">
          <MessageCircle className="w-6 h-6 text-white" />
          {/* Notification Dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Start New Chat
          </div>
        </button>
      </div>

      <VoiceAssistantModal
       isOpen={isVoiceModalOpen}
       onClose={() => setIsVoiceModalOpen(false)}
       onVoiceResponse={handleVoiceResponse}
     />
  </div>
);
};

export default Chatbotnew;