import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";

const VoiceAssistantModal = ({ isOpen, onClose, onVoiceResponse }) => {
  const [cookies] = useCookies(['access_token']);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleVoiceChat = async () => {
    const accessToken = cookies.access_token || null;
    setIsRecording(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/voice_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_mic: true, access_token: accessToken }),
      });
      const data = await res.json();
      setResponseText(data.reply);
      
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
    }
    setIsRecording(false);
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
      backdropFilter: "blur(3px)"
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      width: "90%",
      maxWidth: "500px",
      position: "relative",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      animation: "fadeIn 0.3s ease-out"
    },
    closeBtn: {
      position: "absolute",
      top: "10px",
      right: "15px",
      fontSize: "24px",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#666"
    },
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center"
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: "bold",
      marginBottom: "1.5rem",
      color: "#333"
    },
    recordBtn: {
      padding: "15px 25px",
      borderRadius: "50px",
      fontSize: "1rem",
      fontWeight: "600",
      backgroundColor: isRecording ? "#e53935" : "#4a90e2",
      color: "white",
      border: "none",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: isRecording
        ? "0 0 0 0 rgba(229, 57, 53, 0.4)"
        : "0 4px 12px rgba(74, 144, 226, 0.3)",
      animation: isRecording ? "pulse 1.5s infinite" : "none"
    },
    responseBox: {
      marginTop: "1.5rem",
      backgroundColor: "#f5f8ff",
      padding: "15px",
      borderRadius: "8px",
      width: "100%",
      maxHeight: "200px",
      overflowY: "auto",
      textAlign: "left"
    },
    responseTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#4a90e2"
    },
    responseText: {
      fontSize: "0.95rem",
      lineHeight: "1.5",
      color: "#333"
    },
    doneBtn: {
      marginTop: "1.5rem",
      padding: "10px 25px",
      backgroundColor: "#4caf50",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: "500",
      cursor: "pointer"
    },
    blob: {
      width: "80px",
      height: "80px",
      margin: "1.5rem 0",
    }
  };

  return (
    <div style={styles.overlay}>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(229, 57, 53, 0); }
            100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes blobMove {
            0% { transform: scale(1) translate(0, 0); }
            50% { transform: scale(1.1) translate(5px, -5px); }
            100% { transform: scale(1) translate(0, 0); }
          }@keyframes blobMove {
        0% {
            transform: scale(1) translate(0, 0) rotate(0deg);
        }
        20% {
            transform: scale(1.05) translate(6px, -4px) rotate(2deg);
        }
        40% {
            transform: scale(1.1) translate(-6px, 5px) rotate(-3deg);
        }
        60% {
            transform: scale(1.08) translate(4px, 6px) rotate(1deg);
        }
        80% {
            transform: scale(1.02) translate(-4px, -5px) rotate(-1deg);
        }
        100% {
            transform: scale(1) translate(0, 0) rotate(0deg);
        }
        }
        `}
      </style>

      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>

        <div style={styles.container}>
          <h1 style={styles.title}>Voice Assistant</h1>

          <button onClick={handleVoiceChat} style={styles.recordBtn}>
            {isRecording ? "Listening..." : "Start Voice Chat 🎙️"}
          </button>

          {isRecording && (
            <svg style={styles.blob} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#e53935" d="M55.4,-60.6C70.6,-45.6,81.5,-22.8,77.8,-3.9C74.1,15,55.9,30,40.7,45.7C25.6,61.4,12.8,77.7,-1.2,79.2C-15.1,80.6,-30.3,67.1,-41.9,53.1C-53.5,39.2,-61.6,24.8,-64.3,9C-66.9,-6.8,-64.1,-23.9,-54.9,-37.5C-45.7,-51.2,-30,-61.4,-13.2,-68.8C3.6,-76.2,21.7,-81.2,37.2,-74.3C52.7,-67.4,66.3,-48.3,55.4,-60.6Z" transform="translate(100 100)" style={{ animation: "blobMove 2s infinite ease-in-out" }} />
            </svg>
          )}

          {responseText && (
            <div style={styles.responseBox}>
              <h2 style={styles.responseTitle}>Assistant Reply:</h2>
              <p style={styles.responseText}>{responseText}</p>
            </div>
          )}

          <button
            style={styles.doneBtn}
            onClick={() => {
              if (responseText) onClose();
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
