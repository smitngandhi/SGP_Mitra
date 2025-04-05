import React, { useState, useEffect } from 'react';
import '../Profile.css';
import personheart from '../assets/personheart.svg'
import person from '../assets/person.svg'
import house from '../assets/house.svg'
import chat from '../assets/chat.svg'

import test from "../assets/pencil-fill.svg"
import question from "../assets/question-circle.svg"
import axios from 'axios';
import user_profile from "../assets/user_profile.png"
import { useNavigate } from 'react-router-dom';

function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    email: '',
    gender: '',
    country: '',
    phone_number: ''
  });
  const [currentDate, setCurrentDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    setCurrentDate(formattedDate);
    const accessToken = getCookie('access_token');
    if (accessToken) {
      fetchProfileData(accessToken);
    }
  }, []);

  // Function to get cookie by name
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  // Fetch profile data from backend
  const fetchProfileData = async (accessToken) => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/v1/profile', {
        access_token: accessToken
      });

      const userData = response.data;
      setProfileData({
        full_name: userData.full_name,
        username: userData.username,
        email: userData.email,
        gender: userData.gender || '', // Default if not set
        country: userData.country || '', // Default if not set
        phone_number: userData.phone_number || '' // Default if not set
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to fetch profile data');
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError(null); // Clear any previous errors
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };


  // Function to save profile changes
  const saveProfileChanges = async () => {
    try {
      const accessToken = getCookie('access_token');
      
      // Prepare the data to be sent
      const updateData = {
        access_token: accessToken,
        full_name: profileData.full_name,
        username: profileData.username,
        gender: profileData.gender,
        country: profileData.country,
        phone_number: profileData.phone_number
      };

      // Make API call to update profile
      const response = await axios.post('http://127.0.0.1:5000/api/v1/update_profile', updateData);

      // If update is successful
      if (response.status === 200) {
        // Update local state with returned user data
        if (response.data.user_data) {
          setProfileData(response.data.user_data);
        }
        
        // Show success message
        console.log(response.data.msg);
        
        // Toggle editing off
        setIsEditing(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Handle error 
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.msg || 'Failed to update profile');
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Error updating profile');
      }
    }
  };
  const navItems = [
      { icon: chat, label: 'MindChat', path: '/chatbot'},
          { icon: test, label: 'Self Test ', path: '/test'},
          { icon: personheart, label: 'SelfCare Plans', path: '/selfcare'},
          { icon: question, label: 'FAQs', path: '/faqs'},
          { icon: person, label: 'Profile', path: '/profile'},    
          { icon: house, label: 'Home', path: '/home'},
    ];
  
  return (
    <div className="app-container">
      {/* Sidebar */}
      
      <aside className="sidebar">
        <h2 className="Mitra">MITRA</h2>
        <nav>
          <ul>
            {navItems.map((item, idx) => (
              <li 
                key={idx} 
                className="nav-item" 
                onClick={() => navigate(item.path)}
              >
                <img src={item.icon} alt={`${item.label} Logo`} className="menu-logo" />
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
        </aside>

      {/* Main content */}
      <div className="main-content">
        <div className="header">
          <h1>Welcome, {profileData.username}</h1>
          <p className="date">{currentDate}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner" style={{
            backgroundColor: '#ffdddd',
            color: '#ff0000',
            padding: '10px',
            marginBottom: '15px',
            borderRadius: '5px'
          }}>
            {error}
          </div>
        )}

        <div className="profile-banner">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              <img src={user_profile} alt="Profile" />
            </div>
          </div>
          <div className="profile-details">
            <h2 className="user-name">{profileData.full_name}</h2>
            <button 
              className="edit-btn" 
              onClick={isEditing ? saveProfileChanges : handleEditToggle}
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label className="Text">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                value={profileData.full_name} 
                onChange={isEditing ? handleInputChange : undefined}
                disabled={!isEditing} 
                className="form-control" 
              />
            </div>
            <div className="form-group">
              <div className="label-with-tag">
                <label className="Text">Phone Number</label>
                {!isEditing && !profileData.phone_number}
              </div>
              {isEditing ? (
                <input 
                  type="text" 
                  name="phone_number"
                  value={profileData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Enter Phone Number" 
                  className="form-control" 
                />
              ) : (
                <input 
                  type="text" 
                  value={profileData.phone_number || ''} 
                  disabled 
                  className="form-control" 
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="Text">Gender</label>
              {isEditing ? (
                <div className="select-wrapper">
                  <select 
                    name="gender"
                    className="form-control"
                    value={profileData.gender}
                    onChange={handleInputChange}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={profileData.gender} 
                  disabled 
                  className="form-control" 
                />
              )}
            </div>
            <div className="form-group">
              <div className="label-with-tag">
                <label className="Text">Country</label>
                {!isEditing && profileData.country === 'India'}
              </div>
              {isEditing ? (
                <div className="select-wrapper">
                  <select 
                    name="country"
                    className="form-control"
                    value={profileData.country}
                    onChange={handleInputChange}
                  >
                    <option>India</option>
                    <option>USA</option>
                    <option>UK</option>
                  </select>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={profileData.country} 
                  disabled 
                  className="form-control" 
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="Text">Language</label>
              <input 
                type="text" 
                value="English" 
                disabled 
                className="form-control" 
              />
            </div>
          </div>

          <div className="email-section">
            <label className="My-Email">My email Address</label>
            <div className="email-container">
              <div className="email-box">
                <div className="email-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="email-info">
                  <div className="email">{profileData.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;