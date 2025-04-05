import React, { useState } from 'react';
import '../breathing.css';
import breath from '../assets/breath.mp4'
import { useNavigate } from 'react-router-dom';


function Breathing() {
    const [isCompleted, setIsCompleted] = useState(false);
    const navigate = useNavigate();
  
    // Mark isCompleted when video ends
    const handleVideoEnd = () => {
      setIsCompleted(true);
    };
  
    // When "Completed" is clicked, store a flag for Breathing, navigate to main
    const handleCompletedClick = () => {
      localStorage.setItem('breathingCompleted', 'true');
      navigate('/selfcare'); // Return to main page
    };
  
    return (
      <div className="breathing-container">
        <h2 className="instruction-text">
          Follow the breathing exercise instructions...
        </h2>
  
        <video
          className="breathing-video"
          src={breath}
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
  
  export default Breathing;