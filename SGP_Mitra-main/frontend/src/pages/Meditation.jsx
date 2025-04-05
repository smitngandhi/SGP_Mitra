import React, { useState, useRef, useEffect } from 'react';
import '../meditation.css';
import medi from '../assets/medi.mp4'
import { useNavigate } from 'react-router-dom';


function Meditation() {
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();

  // Mark isCompleted when video ends
  const handleVideoEnd = () => {
    setIsCompleted(true);
  };

  // When "Completed" is clicked, store a flag for Meditation, navigate to main
  const handleCompletedClick = () => {
    localStorage.setItem('meditationCompleted', 'true');
    navigate('/selfcare'); // Return to main page
  };

  return (
    <div className="breathing-container">
            <video
        className="breathing-video"
        src={medi}
        autoPlay
        onEnded={handleVideoEnd}
        playsInline
      />

      {isCompleted && (
        <div className="completed-box" onClick={handleCompletedClick}>
          <p>Completed</p>
        </div>
      )}
    </div>
  );
}

export default Meditation;