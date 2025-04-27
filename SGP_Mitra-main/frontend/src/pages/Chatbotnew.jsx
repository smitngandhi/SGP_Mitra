import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import MoodDetector from "../components/MoodDetector";
import "../Chatbotnew.css";
import robotImage from "../assets/robotnew.png"; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCookies } from 'react-cookie';
import VoiceAssistantModal from "./VoiceAssistantModel";
import voice from "../assets/voice.png";
import recording from "../assets/recording.png";
import send from "../assets/send.png";
import sendhover from "../assets/sendhover.png";




const Chatbotnew = () => {
    const [cookies] = useCookies(['access_token']);
    const [sentiment, setSentiment] = useState(0.5); // 0 (sad) to 1 (happy)
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [chatStarted, setChatStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    
    // Ref for auto-scrolling to bottom of messages
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const suggestionOptions = [
        "I'm feeling stressed today",
        "Help me sleep better",
        "Quick mood boost ideas",
        "Mindfulness exercises"
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

      const handleSendClick = (e) => {
        handleSubmit(e);
        setMessageSent(true);
    
        setTimeout(() => {
          setMessageSent(false);
        }, 500); // remove send animation after 0.5s (matches CSS sendPulse)
      };

    // Auto-scroll only when new messages are added and user isn't manually scrolling
    useEffect(() => {
        if (messages.length > 0 && !isUserScrolling) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Remove 'isNew' flag after animation completes
        const timer = setTimeout(() => {
            setMessages(messages.map(msg => ({...msg, isNew: false})));
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [messages, isUserScrolling]);

    // Detect when user is manually scrolling
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;
        
        // If not at bottom, user is manually scrolling
        setIsUserScrolling(!isAtBottom);
        
        // If user scrolls back to bottom, reset scrolling state
        if (isAtBottom) {
            setIsUserScrolling(false);
        }
    };

    // Handle fetching response from API
    const fetchChatbotResponse = async (message) => {
        const accessToken = cookies.access_token || null;
        console.log(accessToken)
        // Set loading state to show typing indicator
        setIsLoading(true);
        
        try {
            // API call
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
            // console.log(data)
            // Short delay to show typing animation
            setTimeout(() => {
                if (response.ok) {
                    // Add bot response to chat with isNew flag for animation
                    setMessages(prev => {
                        const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
                        return [...updatedPrev, { 
                            role: 'ai',
                            text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.reply}</ReactMarkdown>,
                            isNew: true 
                        }];
                    });
                    
                    // Reset user scrolling when a new message is added
                    setIsUserScrolling(false);
                    
                    // Update mood meter if sentiment score is provided
                    if (data.sentiment_score !== undefined) {
                        setSentiment(data.sentiment_score);
                    }
                } else {
                    // Handle error response
                    console.error("API Error:", data.msg || "No response from API.");
                    setMessages(prev => {
                        const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
                        return [...updatedPrev, { 
                            text: 'Sorry, I had trouble understanding that. Can you try again?', 
                            sender: "bot",
                            isNew: true 
                        }];
                    });
                    setIsUserScrolling(false);
                }
                setIsLoading(false);
            }, 1000); // 1 second delay for typing animation
            
        } catch (error) {
            console.error("Error fetching response:", error);
            setTimeout(() => {
                setMessages(prev => {
                    const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
                    return [...updatedPrev, { 
                        text: 'Network error. Please check your connection and try again.', 
                        sender: "bot",
                        isNew: true 
                    }];
                });
                setIsUserScrolling(false);
                setIsLoading(false);
            }, 1000);
        }
    };

    const handleSubmit = () => {
        if (inputText.trim() === "") return;
        
        // Add user message to chat with isNew flag for animation
        setMessages(prev => {
            const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
            return [...updatedPrev, { 
                text: inputText, 
                sender: "user",
                isNew: true 
            }];
        });
        
        // Animation for send button
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 500);
        
        setInputText("");
        
        // Set chat as started, which removes welcome screen
        setChatStarted(true);
        
        // Reset user scrolling when sending a new message
        setIsUserScrolling(false);
        
        // Get response from chatbot API
        fetchChatbotResponse(inputText);
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleQuickQuestion = (question) => {
        // Add the suggestion as a user message with isNew flag
        setMessages(prev => {
            const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
            return [...updatedPrev, { 
                text: question, 
                sender: "user",
                isNew: true 
            }];
        });
        
        // Animation for send button
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 500);
        
        // Clear input field
        setInputText("");
        
        // Set chat as started, which removes welcome screen
        setChatStarted(true);
        
        // Reset user scrolling when asking a quick question
        setIsUserScrolling(false);
        
        // Get response from chatbot API
        fetchChatbotResponse(question);
    };

    // Handle voice chat response
    const handleVoiceResponse = (reply) => {
        console.log(reply)
        // Add a placeholder user message for voice input
        setMessages(prev => {
            const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
            return [...updatedPrev, { 
                text: `${reply.user_message || "Voice message"}`, 
                sender: "user",
                isNew: true 
            }];
        });

        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 500);
        
        setInputText("");
        
        // Set chat as started, which removes welcome screen
        setChatStarted(true);
        
        // Reset user scrolling when sending a new message
        setIsUserScrolling(false);
        
        // Add the AI response from voice chat
        setMessages(prev => {
            const updatedPrev = prev.map(msg => ({...msg, isNew: false}));
            return [...updatedPrev, { 
                role: 'ai',
                text: <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.reply}</ReactMarkdown>,
                isNew: true 
            }];
        });
        
        // Reset user scrolling when a new message is added
        setIsUserScrolling(false);
        

        setSentiment(reply.sentiment_score);

    };

    return (
        <>
            <Navbar />
            <div className="chat-container">
                {!chatStarted ? (
                    <div className="welcome-screen">
                        <div className="floating-robot">
                            <img src={robotImage} alt="MITRA Robot" className="robot-image" />
                        </div>
                        
                        <div className="welcome-header">
                            <div className="pulsing-circle"></div>
                            <h2>Welcome to MITRA</h2>
                        </div>
                        <p className="welcome-subtitle">I'm here to support your emotional health in any way I can!</p>
                        
                        <div className="horizontal-suggestions">
                            <p>Try saying:</p>
                            <div className="suggestion-row">
                                {suggestionOptions.map((option, index) => (
                                    <button 
                                        key={index} 
                                        className="suggestion-button"
                                        onClick={() => handleQuickQuestion(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div 
                        className="messages-container"
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                    >
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`message ${message.sender === "user" ? "user-message" : "bot-message"} ${message.isNew ? 'message-new' : ''}`}
                            >
                                {message.text}
                            </div>
                        ))}
                        
                        {/* Typing indicator when loading */}
                        {isLoading && (
                            <div className="message bot-message typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                        
                        {/* Invisible element for scrolling to bottom */}
                        <div ref={messagesEndRef} />
                    </div>
                )}
                
                <div className="input-area">
                    <input 
                        type="text" 
                        className="message-input" 
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message here..."
                    />
                    <button 
                            className={`send-button ${messageSent ? "send-animation" : ""}`} 
                            onMouseEnter={handleMouseEntersend}
                            onMouseLeave={handleMouseLeavesend}
                            onClick={handleSendClick}
                            >
                            <img 
                                src={isSending ? sendhover : send} 
                                alt="send" 
                                className="send-icon" 
                            />
                    </button>

                    <button className="voice-button" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={() => {
                        console.log("Voice button CLicked")
                        setIsVoiceModalOpen(true)}}>
                    <img 
                        src={isRecording ? recording : voice} 
                        alt="voice" 
                        className="voice-icon"
                    />
                     </button>

                    {/* Mood Meter */}
                    <div className="mood-meter">
                        <MoodDetector sentiment={sentiment} />
                    </div>
                </div>
            </div>
            
            {/* Voice Assistant Modal */}
            <VoiceAssistantModal 
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onVoiceResponse={handleVoiceResponse}
            />
        </>
    );
};

export default Chatbotnew;