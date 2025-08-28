import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import "../ChatbotWidget.css";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm Mitra. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1); // Start with 1 for welcome message
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(open);

  // Keep ref in sync with open state
  useEffect(() => {
    isOpenRef.current = open;
  }, [open]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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