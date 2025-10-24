import { useState, useEffect, useRef } from "react";
import MoodDetector from "../components/MoodDetector";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCookies } from 'react-cookie';
import VoiceAssistantModal from "./VoiceAssistantModel";
import sendSound from "../assets/sendmsg.mp3";
import receiveSound from "../assets/receivemsg.mp3";
import { getApiUrl } from '../config/api';
import {
  Send,
  Mic,
  Bot,
  User,
  Pin,
  Search,
  Settings,
  MessageCircle,
  Plus,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Chatbotnew = () => {
  const [cookies] = useCookies(['access_token']);
  const [sentiment, setSentiment] = useState(0.5);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // Session-based state
  const [activeChat, setActiveChat] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [groupedSessions, setGroupedSessions] = useState({});
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const suggestionOptions = [
    { text: "I'm feeling stressed today", icon: "🧠" },
    { text: "Help me sleep better", icon: "🌙" },
    { text: "Quick mood boost ideas", icon: "✨" },
    { text: "Mindfulness exercises", icon: "💜" }
  ];

  // --- SESSION MANAGEMENT ---

  const loadChatSessions = async () => {
    const accessToken = cookies.access_token || null;
    if (!accessToken) return;

    setIsLoadingSessions(true);
    try {
      const response = await fetch(getApiUrl("/chat/sessions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.sessions || []);
        setGroupedSessions(data.grouped_sessions || {});
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSession = async (sessionId) => {
    const accessToken = cookies.access_token || null;
    if (!accessToken) return;
    console.log('Loading session:', sessionId);

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(`/chat/sessions/${sessionId}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken }),
      });
      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
        setActiveChat(session);
        const formattedMessages = session.messages?.map(msg => {
    if (msg.user) return { text: msg.user, sender: 'user' }
    if (msg.bot) return { text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.bot}</ReactMarkdown>, sender: 'bot' }
    return null
}).filter(Boolean);
        setMessages(formattedMessages);
        setChatStarted(true);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const createNewChat = async () => {
    const accessToken = cookies.access_token || null;
    if (!accessToken) {
      // For unauthenticated users, just clear the state
      setMessages([]);
      setCurrentSession(null);
      setActiveChat(null);
      setChatStarted(true);
      return;
    }

    try {
      // Create a new session via backend
      const response = await fetch(getApiUrl("/chat/sessions/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      
      if (response.ok) {
        const newSession = await response.json();
        console.log('Created new session:', newSession);
        setCurrentSession(newSession);
        setActiveChat(newSession);
        setMessages([]);
        setChatStarted(true);
        loadChatSessions(); // Refresh the sidebar
      } else {
        // Fallback to local state management
        setMessages([]);
        setCurrentSession(null);
        setActiveChat(null);
        setChatStarted(true);
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      // Fallback to local state management
      setMessages([]);
      setCurrentSession(null);
      setActiveChat(null);
      setChatStarted(true);
    }
  };

  useEffect(() => {
    loadChatSessions();
  }, [cookies.access_token]);

  // --- CHAT LOGIC ---

  const playSound = (sound) => {
    try {
      new Audio(sound).play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Sound playback error:', error);
    }
  };
  const typeMessage = (fullText, sender = "bot", speed = 30, onComplete) => {
  let index = 0;
  const intervalId = setInterval(() => {
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.isTyping) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastMessage,
          text: fullText.slice(0, index + 1)
        };
        return updated;
      } else {
        return [...prev, { text: fullText.slice(0, 1), sender, isTyping: true }];
      }
    });

    index++;
    if (index >= fullText.length) {
      clearInterval(intervalId);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], isTyping: false };
        return updated;
      });
      if (onComplete) onComplete();
    }
  }, speed);
};

  const fetchChatbotResponse = async (message) => {
    const accessToken = cookies.access_token || null;
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl("/chat/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          session_id: currentSession?.session_id, // Will create new session if null
          access_token: accessToken,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update session info if new session was created or title changed
        if (data.session_id) {
          const sessionInfo = { 
            session_id: data.session_id, 
            title: data.session_title || currentSession?.title || "New Chat" 
          };
          
          if (!currentSession || currentSession.session_id !== data.session_id) {
            setCurrentSession(sessionInfo);
            setActiveChat(sessionInfo);
          } else if (data.session_title && data.session_title !== currentSession.title) {
            // Update title if it changed (e.g., from "New Chat" to generated title)
            setCurrentSession(prev => ({ ...prev, title: data.session_title }));
            setActiveChat(prev => ({ ...prev, title: data.session_title }));
          }
        }
        
        setMessages(prev => [...prev, {
          text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.reply}</ReactMarkdown>,
          sender: "bot",
          isNew: true
        }]);

        if (data.sentiment_score !== undefined) {
          setSentiment(data.sentiment_score);
        }
        
        // Refresh sidebar to show updated sessions
        loadChatSessions();
      } else {
        setMessages(prev => [...prev, {
          text: 'Sorry, I had trouble understanding. Can you try again?',
          sender: "bot",
          isNew: true
        }]);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
       setMessages(prev => [...prev, {
          text: 'Network error. Please check your connection.',
          sender: "ai",
          isNew: true
        }]);
    } finally {
        setIsLoading(false);
        playSound(receiveSound);
    }
  };

  const handleSubmit = () => {
    if (inputText.trim() === "") return;
    
    const newUserMessage = {
      text: inputText,
      sender: "user",
      isNew: true
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatStarted(true);
    fetchChatbotResponse(inputText);
    setInputText("");
    playSound(sendSound);
  };

  // --- UI HANDLERS & HELPERS ---

  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserScrolling]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;
    setIsUserScrolling(!isAtBottom);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickQuestion = (question) => {
    setMessages([{
      text: question,
      sender: "user",
      isNew: true
    }]);
    setChatStarted(true);
    fetchChatbotResponse(question);
    playSound(sendSound);
  };

  const togglePinChat = async (sessionId) => {
    const accessToken = cookies.access_token || null;
    if (!accessToken) return;

    try {
      await fetch(getApiUrl(`/chat/sessions/${sessionId}/pin`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      loadChatSessions();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    const accessToken = cookies.access_token || null;
    if (!accessToken) return;

    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/chat/sessions/${sessionId}`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (response.ok) {
        // If we're currently viewing the deleted session, clear the chat
        if (currentSession?.session_id === sessionId) {
          setMessages([]);
          setCurrentSession(null);
          setActiveChat(null);
          setChatStarted(false);
        }
        loadChatSessions();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = (now - date) / 1000;
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = diffInSeconds / 60;
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    const diffInHours = diffInMinutes / 60;
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen-100% w-full bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 font-['Inter',sans-serif]">
      <div className="h-[calc(100vh-80px)] mt-20 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 shadow-2xl flex-shrink-0 flex flex-col border-r border-purple-200/30 backdrop-blur-sm transition-all duration-300 ease-in-out`}>
          <div className="p-4 border-b border-purple-200/30 flex items-center justify-between">
              {!isSidebarCollapsed && (
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-purple-300/50">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-gray-800 font-semibold">Welcome!</h3>
                    </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                {!isSidebarCollapsed && (
                  <button onClick={createNewChat} className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-200">
                      <Plus className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                  className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-200"
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              </div>
          </div>

          {!isSidebarCollapsed && (
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
          )}

          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoadingSessions ? <div className="p-4 text-center text-purple-600">Loading chats...</div> : 
              Object.entries(groupedSessions).map(([groupTitle, sessions]) => (
                sessions.length > 0 && (
                  <div key={groupTitle} className="p-4">
                    <h4 className="text-purple-700 text-sm font-semibold uppercase tracking-wide mb-4 px-2">{groupTitle}</h4>
                    <div className="space-y-3">
                      {sessions.map((session) => (
                      <div
                        key={session.session_id}
                        onClick={() => loadSession(session.session_id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-purple-100 hover:shadow-lg hover:scale-[1.02] hover:ring-2 hover:ring-purple-400/30 ${
                          activeChat?.session_id === session.session_id ? 'bg-purple-100 ring-2 ring-purple-400/50 shadow-lg scale-[1.02]' : 'bg-white/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-gray-800 font-semibold text-sm truncate mb-1">{session.title}</h5>
                          </div>
                                <div className="flex items-center space-x-1">
        <button
          onClick={(e) => { e.stopPropagation(); togglePinChat(session.session_id); }}
          className={`p-1.5 rounded-md transition-colors ${session.is_pinned ? 'text-purple-700 bg-purple-200' : 'text-purple-400 hover:text-purple-700 hover:bg-purple-100'}`}
          title={session.is_pinned ? "Unpin chat" : "Pin chat"}
        >
          <Pin className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteSession(session.session_id); }}
          className="p-1.5 rounded-md transition-colors text-red-400 hover:text-red-700 hover:bg-red-100"
          title="Delete chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
              ))}
            </div>
          )}
          
          {!isSidebarCollapsed && (
            <div className="p-4 border-t border-purple-200/30 bg-white/60">
              <div className="bg-gradient-to-r from-purple-100/60 to-purple-50/60 rounded-2xl p-4 backdrop-blur-sm shadow-lg">
                <MoodDetector sentiment={sentiment} />
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50">
          {!chatStarted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
              <div className="mb-10 relative">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl ring-4 ring-purple-200/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-300/30 via-transparent to-purple-600/30 rounded-full animate-pulse"></div>
                  <Bot className="w-16 h-16 text-white relative z-10" />
                </div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent mb-3 leading-tight">
                Welcome to MITRA
              </h1>
              <p className="text-sm text-gray-600 mb-6 max-w-lg leading-relaxed font-medium">
                I'm here to support your emotional health. How can I help you today?
              </p>
              <div className="w-full max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestionOptions.slice(0, 4).map((option, index) => (
                    <button
                      key={index}
                      className="group relative bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 rounded-lg p-4 w-full transition-all duration-300 hover:shadow-md hover:scale-[1.02] text-left overflow-hidden"
                      onClick={() => handleQuickQuestion(option.text)}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <span className="text-sm">{option.icon}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 group-hover:text-purple-800 transition-colors duration-300">
                          {option.text}
                        </h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/90 backdrop-blur-md shadow-sm border-b border-purple-100 px-4 py-3 flex-shrink-0">
                <h2 className="font-bold text-gray-800 text-lg">{activeChat?.title || 'New Chat'}</h2>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0" ref={messagesContainerRef} onScroll={handleScroll}>
                <div className="p-4 space-y-4 bg-gradient-to-b from-white/50 via-purple-50/20 to-indigo-50/30 min-h-full">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl shadow-lg ${message.sender === "user" ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-tr-md" : "bg-gradient-to-br from-white to-purple-50 text-purple-900 border border-purple-200/50 rounded-tl-md"}`}>
                        <div className="text-sm leading-relaxed">{message.text}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200/50 p-4 rounded-2xl rounded-tl-md shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <span className="text-sm text-purple-600 font-medium">MITRA is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-md border-t border-purple-100 p-6 flex-shrink-0">
                <div className="flex items-end space-x-4 max-w-5xl mx-auto">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className="w-full px-6 py-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 resize-none transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-lg text-lg"
                    rows={1}
                    style={{ minHeight: '60px', maxHeight: '120px' }}
                  />
                  <button
                    className="p-4 rounded-2xl transition-all duration-300 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-105 hover:shadow-purple-300"
                    onClick={() => setIsVoiceModalOpen(true)}
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <button
                    className="p-4 rounded-2xl transition-all duration-300 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 hover:scale-105 hover:shadow-purple-300"
                    onClick={handleSubmit}
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentSession={currentSession}
        setCurrentSession={setCurrentSession}
        setActiveChat={setActiveChat}
        loadChatSessions={loadChatSessions}
        setMessages={setMessages}
        setChatStarted={setChatStarted}
        sentiment={sentiment}
        setSentiment={setSentiment}
      />
  </div>
  );
};

export default Chatbotnew;