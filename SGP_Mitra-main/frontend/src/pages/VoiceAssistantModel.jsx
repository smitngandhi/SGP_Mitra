import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";

const VoiceAssistantModal = ({ isOpen, onClose, onVoiceResponse }) => {
  const [cookies] = useCookies(["access_token"]);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isHovering, setIsHovering] = useState(false);

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
    setResponseText(""); // Clear previous response when starting a new voice chat
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
      backdropFilter: "blur(3px)",
    },
    modal: {
      backgroundColor: isRecording ? "transparent" : "white",
      borderRadius: "16px",
      padding: "32px",
      width: "90%",
      maxWidth: "500px",
      position: "relative",
      boxShadow: isRecording ? "none" : "0 10px 30px rgba(0, 0, 0, 0.25)",
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
      backgroundColor: "#7a3fa9", // Indigo
      color: "white",
      border: "none",
      cursor: "pointer",
      transition: "background 0.3s ease, transform 0.3s ease",
      boxShadow: "0 6px 18px rgba(79, 70, 229, 0.4)",
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
    },
    blob: {
      width: "140px",
      height: "140px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #a78bfa, #c084fc, #f472b6)", // pastel purples and pinks
      animation: "listeningPulse 1.8s infinite ease-in-out",
      margin: "2rem 0",
      boxShadow: "0 0 20px rgba(200, 132, 252, 0.5)",
    },
  };

  return (
    <div style={styles.overlay}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes listeningPulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(200, 132, 252, 0.5);
            }
            50% {
              transform: scale(1.15);
              box-shadow: 0 0 35px rgba(244, 114, 182, 0.7);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 20px rgba(200, 132, 252, 0.5);
            }
          }
        `}
      </style>

      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>

        <div style={styles.container}>
          {!isRecording ? (
            <>
              <button onClick={handleVoiceChat} style={styles.recordBtn}>
                Start Voice Chat 🎙️
              </button>
              {responseText && (
                <div style={styles.responseBox}>
                  <h2 style={styles.responseTitle}>Assistant Reply:</h2>
                  <p style={styles.responseText}>{responseText}</p>
                </div>
              )}
            </>
          ) : (
            <div style={styles.blob} />
          )}

          <button
            style={styles.doneBtn}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => {
              setResponseText(""); // Clear response text when done
              setIsRecording(false); // Stop recording when done
              onClose();
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
