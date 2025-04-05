import React, { useState, useEffect } from 'react';
import '../Chatbot.css';
import personheart from '../assets/personheart.svg'
import person from '../assets/person.svg'
import house from '../assets/house.svg'
import chat from '../assets/chat.svg'

import test from "../assets/pencil-fill.svg"
import question from "../assets/question-circle.svg"
import axios from 'axios';
import user_profile from "../assets/user_profile.png"
import { useNavigate } from 'react-router-dom';

function Plan() {
    const navigate = useNavigate();

  const navItems = [
     { icon: chat, label: 'MindChat', path: '/chatbot'},
         { icon: test, label: 'Self Test ', path: '/test'},
         { icon: personheart, label: 'SelfCare Plans', path: '/plan'},
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
        <div className="sidebar-bottom">
        </div>
    </div>
  );
}

export default Plan;