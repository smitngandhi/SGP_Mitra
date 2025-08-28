import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import './AdminRecommendationPanel.css';

const AdminRecommendationPanel = () => {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cookies] = useCookies(['access_token']);

  useEffect(() => {
    fetchServiceStatus();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/recommendation-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cookies.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setServiceStatus(data.service_running);
      setMessage(data.message);
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      setMessage('Failed to fetch service status');
    }
  };

  const handleStartService = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/start-recommendation-service', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cookies.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setServiceStatus(true);
        setMessage('Recommendation service started successfully');
      } else {
        setMessage('Failed to start service');
      }
    } catch (error) {
      console.error('Failed to start service:', error);
      setMessage('Error starting service');
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/stop-recommendation-service', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cookies.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setServiceStatus(false);
        setMessage('Recommendation service stopped successfully');
      } else {
        setMessage('Failed to stop service');
      }
    } catch (error) {
      console.error('Failed to stop service:', error);
      setMessage('Error stopping service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-recommendation-panel">
      <div className="panel-header">
        <h3>🤖 Smart Recommendation Agent</h3>
        <div className={`status-indicator ${serviceStatus ? 'running' : 'stopped'}`}>
          <span className="status-dot"></span>
          {serviceStatus ? 'Running' : 'Stopped'}
        </div>
      </div>

      <div className="panel-content">
        <div className="service-info">
          <h4>Service Status</h4>
          <p className="status-message">{message}</p>
          
          <div className="service-details">
            <div className="detail-item">
              <span className="label">Analysis Interval:</span>
              <span className="value">Every 5 minutes</span>
            </div>
            <div className="detail-item">
              <span className="label">Data Source:</span>
              <span className="value">User tracking collection</span>
            </div>
            <div className="detail-item">
              <span className="label">LLM Integration:</span>
              <span className="value">Together.AI (Exaone-3.5)</span>
            </div>
          </div>
        </div>

        <div className="service-controls">
          <h4>Service Controls</h4>
          <div className="control-buttons">
            <button
              className={`control-btn start-btn ${serviceStatus ? 'disabled' : ''}`}
              onClick={handleStartService}
              disabled={loading || serviceStatus}
            >
              {loading ? 'Starting...' : 'Start Service'}
            </button>
            
            <button
              className={`control-btn stop-btn ${!serviceStatus ? 'disabled' : ''}`}
              onClick={handleStopService}
              disabled={loading || !serviceStatus}
            >
              {loading ? 'Stopping...' : 'Stop Service'}
            </button>
            
            <button
              className="control-btn refresh-btn"
              onClick={fetchServiceStatus}
              disabled={loading}
            >
              Refresh Status
            </button>
          </div>
        </div>

        <div className="service-metrics">
          <h4>How It Works</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <h5>Behavior Analysis</h5>
                <p>Analyzes user page visit patterns and time spent to identify engagement preferences</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🧠</div>
              <div className="metric-content">
                <h5>AI Recommendations</h5>
                <p>Uses LLM to generate personalized, contextually-aware page recommendations</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <h5>Smart Targeting</h5>
                <p>Recommends pages where users spent most time, with intelligent tie-breaking</p>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🔄</div>
              <div className="metric-content">
                <h5>Continuous Learning</h5>
                <p>Adapts recommendations based on evolving user behavior patterns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRecommendationPanel;
