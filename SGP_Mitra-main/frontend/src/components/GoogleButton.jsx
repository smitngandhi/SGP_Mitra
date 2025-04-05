import React, { useState } from "react";
import googleIcon from "../assets/google.svg";
import googleColorIcon from "../assets/google_color.svg";

const GoogleButton = ({ text }) => {
  const [icon, setIcon] = useState(googleIcon);

  const handleLogin = () => {
    // Redirect to the backend route for Google login
    window.location.href = "http://127.0.0.1:5000/api/v1/login/google";
    
  };

  return (
    <button
    onClick={handleLogin}
    onMouseEnter={() => setIcon(googleColorIcon)}
    onMouseLeave={() => setIcon(googleIcon)}
    className="w-full flex items-center justify-center border py-2 rounded-lg 
               bg-white shadow-md transition-all duration-300 
               hover:bg-gray-200 hover:shadow-lg"
  >
    <img
      src={icon}
      className="h-6 mr-2 transition-transform duration-300"
      alt="Google"
    />
    <span className="text-gray-800">{text}</span>
  </button>
  
  );
};

export default GoogleButton;
