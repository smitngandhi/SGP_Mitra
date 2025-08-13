import { useState, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";

const VoiceAssistantModal = ({ isOpen, onClose, onVoiceResponse }) => {
  const [cookies] = useCookies(["access_token"]);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Function to play audio response
  const playAudioResponse = (audioBase64) => {
  try {
    // Decode base64 to raw binary
    const byteCharacters = atob(audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Make Blob (adjust MIME type to match your backend output_format)
    const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' }); // since you use mp3_44100_128
    const audioUrl = URL.createObjectURL(audioBlob);

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlayingAudio(true);

      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      audioRef.current.onerror = () => {
        console.error("Error playing audio response");
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  } catch (error) {
    console.error("Error setting up audio playback:", error);
    setIsPlayingAudio(false);
  }
};


  // Engaging loading messages
  const loadingMessages = [
    { text: "🎧 Listening carefully to your voice...", icon: "🎧" },
    { text: "🧠 Understanding your request...", icon: "🧠" },
    { text: "✨ Crafting the perfect response...", icon: "✨" },
    { text: "🔐 Your privacy is protected...", icon: "🔐" },
    { text: "🤖 AI is thinking just for you...", icon: "🤖" },
    { text: "💭 Processing with care...", icon: "💭" },
    { text: "🎯 Almost ready with your answer...", icon: "🎯" },
    { text: "🌟 Making magic happen...", icon: "🌟" },
    { text: "🛡️ Secure processing in progress...", icon: "🛡️" },
    { text: "💡 Generating insights...", icon: "💡" }
  ];

  // Cycle through loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500); // Change message every 1.5 seconds
      return () => clearInterval(interval);
    }
  }, [isLoading, loadingMessages.length]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  
  const handleVoiceChat = async () => {
    const accessToken = cookies.access_token || null;
    
    setIsRecording(true);
    setResponseText("");
    setIsLoading(false); // Reset loading state

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsLoading(true); // Show loading when processing starts
        setIsRecording(false); // Hide recording UI
        setLoadingMessageIndex(0); // Reset message index
        
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice_input.webm");
        formData.append("access_token", accessToken);
        console.log(accessToken)
        console.log("Sending voice data to server...");
        console.log("FormData:", formData);

        try {
          const res = await fetch("http://localhost:5000/api/v1/voice_chat", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          setResponseText(data.reply);

          // Play audio response if available
          if (data.audio) {
            playAudioResponse(data.audio);
          }

          if (data.reply && data.user_message && data.sentiment_score !== undefined) {
            onVoiceResponse({
              reply: data.reply,
              user_message: data.user_message,
              sentiment_score: data.sentiment_score,
            });
          }
        } catch (error) {
          console.error("Error in voice chat:", error);
          setResponseText("Sorry, there was an error processing your voice request.");
        } finally {
          setIsLoading(false); // Hide loading when done
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

    } catch (error) {
      console.error("Microphone error:", error);
      setResponseText("Microphone access was denied or unavailable.");
      setIsRecording(false);
      setIsLoading(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(3px)",
    },
    modal: {
      backgroundColor: (isRecording || isLoading) ? "transparent" : "white",
      borderRadius: "16px",
      padding: "32px",
      width: "90%",
      maxWidth: "500px",
      position: "relative",
      boxShadow: (isRecording || isLoading) ? "none" : "0 10px 30px rgba(0, 0, 0, 0.25)",
      animation: "fadeIn 0.4s ease-out",
    },
    closeBtn: {
      position: "absolute",
      top: "12px",
      right: "18px",
      fontSize: "26px",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#666",
      display: (isRecording || isLoading) ? "none" : "block", // Hide close button during recording/loading
    },
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      marginBottom: "1.8rem",
      color: "#222",
    },
    recordBtn: {
      padding: "15px 30px",
      borderRadius: "50px",
      fontSize: "1.1rem",
      fontWeight: "600",
      backgroundColor: "#7a3fa9",
      color: "white",
      border: "none",
      cursor: "pointer",
      transition: "background 0.3s ease, transform 0.3s ease",
      boxShadow: "0 6px 18px rgba(79, 70, 229, 0.4)",
    },
    stopBtn: {
      padding: "10px 25px",
      borderRadius: "50px",
      fontSize: "1rem",
      fontWeight: "600",
      backgroundColor: "#e53935",
      color: "white",
      border: "none",
      cursor: "pointer",
      marginTop: "15px",
    },
    responseBox: {
      marginTop: "2rem",
      backgroundColor: "#f0f4ff",
      padding: "20px",
      borderRadius: "12px",
      width: "100%",
      maxHeight: "200px",
      overflowY: "auto",
      textAlign: "left",
    },
    responseTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      marginBottom: "10px",
      color: "#4f46e5",
    },
    responseText: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "#333",
    },
    doneBtn: {
      marginTop: "1.5rem",
      padding: "12px 28px",
      backgroundColor: isHovering ? "#7a3fa9" : "#d7c6e6",
      color: isHovering ? "white" : "black",
      border: "none",
      borderRadius: "8px",
      fontWeight: "600",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      display: (isRecording || isLoading) ? "none" : "block", // Hide done button during recording/loading
    },
    blob: {
      width: "140px",
      height: "140px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #a78bfa, #c084fc, #f472b6)",
      animation: "listeningPulse 1.8s infinite ease-in-out",
      margin: "2rem 0",
      boxShadow: "0 0 20px rgba(200, 132, 252, 0.5)",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    },
    loadingSpinner: {
      width: "60px",
      height: "60px",
      border: "6px solid #f3f3f3",
      borderTop: "6px solid #7a3fa9",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginBottom: "1rem",
    },
    loadingText: {
      fontSize: "1.2rem",
      color: "#f3f3f3",
      fontWeight: "600",
      textAlign: "center",
      animation: "fadeInText 0.5s ease-in-out",
      minHeight: "1.5rem",
    },
    audioControls: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      marginTop: "10px",
    },
    audioButton: {
      padding: "8px 16px",
      borderRadius: "20px",
      border: "1px solid #7a3fa9",
      backgroundColor: isPlayingAudio ? "#7a3fa9" : "transparent",
      color: isPlayingAudio ? "white" : "#7a3fa9",
      cursor: "pointer",
      fontSize: "0.9rem",
      transition: "all 0.3s ease",
    },
    speakingIndicator: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      color: "#7a3fa9",
      fontSize: "0.9rem",
      fontWeight: "500",
    },
    loadingIcon: {
      fontSize: "2rem",
      marginBottom: "0.5rem",
      animation: "bounce 1s infinite",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes listeningPulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          @keyframes fadeInText {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <button style={styles.closeBtn} onClick={onClose}>×</button>

          <div style={styles.container}>
            {isLoading ? (
              // Loading state
              <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <div style={styles.loadingIcon}>
                  {loadingMessages[loadingMessageIndex].icon}
                </div>
                <p style={styles.loadingText}>
                  {loadingMessages[loadingMessageIndex].text}
                </p>
              </div>
            ) : isRecording ? (
              // Recording state
              <>
                <div style={styles.blob} />
                <button style={styles.stopBtn} onClick={stopRecording}>
                  ⏹ Stop Recording
                </button>
              </>
            ) : (
              // Default state
              <>
                <button onClick={handleVoiceChat} style={styles.recordBtn}>
                  Start Voice Chat 🎙️
                </button>
                {responseText && (
                  <div style={styles.responseBox}>
                    <h2 style={styles.responseTitle}>Assistant Reply:</h2>
                    <p style={styles.responseText}>{responseText}</p>
                    
                    {/* Audio Controls */}
                    <div style={styles.audioControls}>
                      {isPlayingAudio ? (
                        <div style={styles.speakingIndicator}>
                          <span>🔊</span>
                          <span>Playing response...</span>
                        </div>
                      ) : (
                        <button 
                          style={styles.audioButton}
                          onClick={() => audioRef.current?.play()}
                        >
                          🔊 Play Audio
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              style={styles.doneBtn}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => {
                setResponseText("");
                setIsRecording(false);
                setLoadingMessageIndex(0);
                setIsLoading(false);
                setIsPlayingAudio(false);
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                onClose();
              }}
            >
              Done
            </button>
          </div>
          
          {/* Hidden audio element for playing responses */}
          <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
      </div>
    </>
  );
};

export default VoiceAssistantModal;