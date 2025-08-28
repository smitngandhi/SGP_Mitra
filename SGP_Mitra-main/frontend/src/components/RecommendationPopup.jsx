import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import './RecommendationPopup.css';

const RecommendationPopup = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cookies] = useCookies(['access_token']);
  const navigate = useNavigate();

  // Check for recommendations every 30 seconds
  useEffect(() => {
    if (!cookies.access_token) return;

    const checkRecommendations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/get-recommendation', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cookies.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.has_recommendation && data.recommendation) {
          setRecommendation(data.recommendation);
          setShowPopup(true);
        }
      } catch (error) {
        console.error('Failed to fetch recommendation:', error);
      }
    };

    // Initial check
    checkRecommendations();

    // Set up interval for periodic checks
    const interval = setInterval(checkRecommendations, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [cookies.access_token]);

  const handleAcceptRecommendation = async () => {
    if (!recommendation) return;

    setLoading(true);

    try {
      // Mark recommendation as accepted
      await fetch('http://localhost:5000/api/v1/accept-recommendation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cookies.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Navigate to recommended page
      const targetPath = recommendation.page;
      navigate(targetPath);

      // Close popup
      setShowPopup(false);
      setRecommendation(null);

      // Focus on input field after navigation (if exists)
      setTimeout(() => {
        const inputField = document.querySelector('input[type="text"], textarea, input[type="search"]');
        if (inputField) {
          inputField.focus();
          // Simulate enter key press
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
          });
          inputField.dispatchEvent(enterEvent);
        }
      }, 500);

    } catch (error) {
      console.error('Failed to accept recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissRecommendation = async () => {
    try {
      // Mark recommendation as used (dismissed)
      await fetch('http://localhost:5000/api/v1/accept-recommendation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cookies.access_token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }

    setShowPopup(false);
    setRecommendation(null);
  };

  if (!showPopup || !recommendation) {
    return null;
  }

  return (
    <div className="recommendation-overlay">
      <div className="recommendation-popup">
        <div className="recommendation-header">
          <h3>🎯 Personalized Recommendation</h3>
          <button 
            className="close-button"
            onClick={handleDismissRecommendation}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="recommendation-content">
          <div className="recommendation-title">
            <strong>{recommendation.page_display_name}</strong>
          </div>

          <div className="recommendation-message">
            {recommendation.message}
          </div>

          {recommendation.features && (
            <div className="recommendation-features">
              <strong>Available Features:</strong>
              <p>{recommendation.features}</p>
            </div>
          )}

          {recommendation.reasoning && (
            <div className="recommendation-reasoning">
              <em>{recommendation.reasoning}</em>
            </div>
          )}
        </div>

        <div className="recommendation-actions">
          <button 
            className="accept-button"
            onClick={handleAcceptRecommendation}
            disabled={loading}
          >
            {loading ? 'Navigating...' : 'Take me there!'}
          </button>
          <button 
            className="dismiss-button"
            onClick={handleDismissRecommendation}
            disabled={loading}
          >
            Maybe later
          </button>
        </div>

        <div className="recommendation-footer">
          <small>Based on your usage patterns • Generated by AI</small>
        </div>
      </div>
    </div>
  );
};

export default RecommendationPopup;
