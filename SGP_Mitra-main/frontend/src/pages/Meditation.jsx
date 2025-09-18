import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import medi from "../assets/medi.mp4";

function Meditation() {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleStart = () => {
    const totalSeconds = hour * 3600 + minute * 60;
    if (totalSeconds === 0) {
      alert("Please select a time greater than 0!");
      return;
    }
    setTimeLeft(totalSeconds);
    setIsMeditating(true);
    setIsCompleted(false);
  };

  const handleCancel = () => {
    clearInterval(timerRef.current);
    setIsMeditating(false);
    setIsCompleted(false);
    setTimeLeft(0);
    navigate("/selfcare");
  };

  const handleCompleted = () => {
    clearInterval(timerRef.current);
    setIsCompleted(true);
    setIsMeditating(false);
    localStorage.setItem("meditationCompleted", "true");
    navigate("/selfcare");
  };

  useEffect(() => {
    if (isMeditating && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsMeditating(false);
            setIsCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isMeditating]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      {!isMeditating && !isCompleted && (
        <div style={styles.selectionContainer}>
          <h2 style={styles.title}>🧘 Choose Meditation Time</h2>

          <div style={styles.pickerContainer}>
            <div style={styles.pickerBlock}>
              <div style={styles.wheel}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      ...styles.item,
                      ...(h === hour ? styles.itemSelected : {}),
                    }}
                    onClick={() => setHour(h)}
                  >
                    {h} hr
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.pickerBlock}>
              <div style={styles.wheel}>
                {minutes.map((m) => (
                  <div
                    key={m}
                    style={{
                      ...styles.item,
                      ...(m === minute ? styles.itemSelected : {}),
                    }}
                    onClick={() => setMinute(m)}
                  >
                    {m.toString().padStart(2, "0")} min
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button style={styles.button} onClick={handleStart}>
            Start Meditation ({hour}h {minute}m)
          </button>
        </div>
      )}

      
      {isMeditating && (
        <>
          <div className="breathing-container" style={{ position: 'relative', marginTop: '-20px'}}>
          <video
            className="breathing-video"
            src={medi}
            autoPlay
            playsInline
          />
          </div>
          
          <h2
            style={{
              position: 'absolute',
              bottom: '95px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '0 0 20px rgba(0,0,0,0.7)',
            }}
          >
            {formatTime(timeLeft)}
          </h2>
          <button
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#d9534f',
              color: '#fff',
            }}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </>
      )}

      {isCompleted && (
        <div style={styles.completedContainer}>
          <h2 style={styles.completed}>✅ Meditation Completed</h2>
          <button style={styles.button} onClick={handleCompleted}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    // background: "#d8d8d8ff" ,
    padding: "20px",
  },
  selectionContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "25px",
  },
  title: {
    fontSize: "24px",
    color: "#333",
  },
  pickerContainer: {
    display: "flex",
    gap: "15px",
  },
  pickerBlock: {
    width: "100px",
    height: "180px",
    overflowY: "scroll",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    scrollbarWidth: "none",
  },
  wheel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 0",
  },
  item: {
    width: "100%",
    textAlign: "center",
    padding: "10px 0",
    fontSize: "18px",
    cursor: "pointer",
    borderRadius: "12px",
    transition: "all 0.2s ease",
    color: "#555",
  },
  itemSelected: {
    background: "#f3e8ff",
    fontWeight: "bold",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    color: "#003333",
  },
  button: {
    padding: "12px 28px",
    fontSize: "18px",
    backgroundColor: "#7a3fa9",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "20px",
    transition: "background 0.3s ease",
  },
  cancelButton: {
    padding: "10px 24px",
    fontSize: "16px",
    backgroundColor: "#d9534f",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginTop: "20px",
    transition: "background 0.3s ease",
  },
  meditationContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  completedContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  video: {
    width: "100%",
    maxWidth: "600px",
    borderRadius: "16px",
  },
  timer: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#333",
  },
  completed: {
    fontSize: "24px",
    color: "#333",
  },
};

export default Meditation;