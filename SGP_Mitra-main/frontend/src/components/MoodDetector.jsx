import { useState, useEffect } from "react";

const MoodDetector = ({ sentiment = 0.5 }) => {
  const [label, setLabel] = useState("Neutral");
  
  // Update label whenever sentiment changes
  useEffect(() => {
    if (sentiment < 0.33) setLabel("Sad");
    else if (sentiment < 0.66) setLabel("Neutral");
    else setLabel("Happy");
  }, [sentiment]);

  // Get appropriate color based on sentiment value
  const getMeterColor = () => {
    if (sentiment < 0.33) return "#FF4D4F";  // Red for sad
    if (sentiment < 0.66) return "#FFC107";  // Yellow for neutral
    return "#2ECC71";                        // Green for happy
  };

  return (
    <div style={{ width: '100%', padding: '10px 0' }}>
      <div
        className="mood-meter-container"
        style={{
          background: 'linear-gradient(to right, #FF4D4F, #FFC107, #2ECC71)',
          height: '8px',
          width: '100%',
          borderRadius: '4px',
          position: 'relative',
          margin: 'auto'
        }}
      >
        <div
          className="mood-meter-knob"
          style={{
            position: 'absolute',
            left: `${sentiment * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            border: `2px solid ${getMeterColor()}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.5s ease-out'
          }}
        />
        <div
          className="mood-meter-label"
          style={{
            position: 'absolute',
            left: `${sentiment * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -24px)',
            backgroundColor: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            color: getMeterColor(),
            fontWeight: 'bold',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            transition: 'left 0.5s ease-out, color 0.5s ease-out'
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default MoodDetector;