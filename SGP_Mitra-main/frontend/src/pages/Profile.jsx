import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import profileimg from '../assets/profile.jpg';
import "../Profile.css";
function Profile() {
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
      const response = await axios.post('http://13.211.214.231/api/v1/profile', {
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
  return (
    <>
    <div>
      <div className='WelcomeDisplay'>
        <h1 >Welcome, {profileData.username}</h1>
        <p>Tell me more about you</p>
      </div>
      <div className='Content'>
        <div><img src={profileimg} className='profilevector'></img></div>
        <div className='Details'>
            <div className='twoitem'>
              <div className='detailitem'>
                <div className="Text">Full Name</div>
                <div className='colon'> : </div>
                <div className='inputdata'>
                <input 
                  type="text" 
                  name="full_name"
                  value={profileData.full_name} 
                  onChange={isEditing ? handleInputChange : undefined}
                  disabled={!isEditing} 
                  className="form-control" 
                />
                </div>
              </div>

              <div className='detailitem'>
                <div className="Text">Phone Number</div>
                <div className='colon'> : </div>
                <div className='inputdata'>
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
              </div>

              <div className='twoitem'>
              <div className='detailitem'>
                <div className="Text">Gender</div>
                <div className='colon2'> : </div>
                <div className='inputdata'>
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
              </div>

              <div className='detailitem'>
                <div className="Text">Country</div>
                <div className='colon3'> : </div>
                <div className='inputdata'>
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
              </div>
              

              <div className='twoitem'>
              <div className='detailitem1'>
                <div className="Text">Email</div>
                <div className='colon4'> : </div>
                <div className='inputdata'>
                <div className="Text">{profileData.email}</div>
                </div>
              </div>

              
            </div>
            <div className='editbtncls'>
                  <button 
                    className="edit-btn" 
                    onClick={isEditing ? saveProfileChanges : handleEditToggle}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                  </button>
              </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Profile;