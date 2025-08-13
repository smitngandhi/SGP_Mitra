import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import User from '../assets/User.png'
import image1 from '../assets/image1.jpg'
import React, { useState } from 'react';
import '../After_Login.css';
import { useCookies } from "react-cookie";
import { useEffect } from "react";
import music from "../assets/music.svg"
import heart from "../assets/heart.svg"
import message from "../assets/message.svg"
import test from "../assets/health.svg" 

const After_Login_Home = () => {

        const [cookies, setCookie] = useCookies(["access_token"]);

        useEffect(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const accessTokenFromURL = urlParams.get("access_token");

          if (accessTokenFromURL && !cookies.access_token) {
              console.log("Inside")
              setCookie("access_token", accessTokenFromURL, {
                  path: "/",
                  maxAge : 360000
              });


              console.log("Access token stored in cookies!");

              // Remove the access_token from the URL
              let newURL = window.location.pathname;

              if (newURL.endsWith('/')) {
                newURL = newURL.slice(0, -1);
              }
              window.history.replaceState({}, document.title, newURL);
          }
        }, [cookies.access_token, setCookie]);


        // 6 Testimonials
        const testimonialsData = [
          {
            text: "Mitra's self-assessment tools helped me recognize my anxiety triggers that I'd been overlooking for years. The personalized self-care plan was exactly what I needed to start making positive changes in my daily routine.",
            name: "Keval Shah",
            position: "A GATE Aspirant",
            image: User
          },
          {
            text: "As someone who struggled to understand my fluctuating moods, Mitra's chatbot became my daily companion. It helped me track patterns in my emotional states and suggested practical coping strategies that actually worked for me.",
            name: "Jhil Bhavsar",
            position: "Database Administrator",
            image: User
          },
          {
            text: "The mind state assessments in Mitra gave me insights about myself that years of journaling couldn't provide. I finally understand the connection between my sleep patterns and emotional wellbeing thanks to the detailed analysis.",
            name: "Tisha Patel",
            position: "Backend Developer",
            image: User
          },
          {
            text: "Mitra's self-care plans are realistic and adaptable to my busy schedule. What impressed me most was how the recommendations evolved as my mental state improved. It felt like having a personal wellness coach in my pocket.",
            name: "Rudri Bhatt",
            position: "Graduate Student",
            image: User
          },
          {
            text: "I was skeptical about chatbots, but Mitra's AI surprised me with its empathetic responses. During a particularly difficult week, the guided breathing exercises and mindfulness sessions recommended by Mitra made a tremendous difference.",
            name: "Hemit Rana",
            position: "Teaching Assistant",
            image: User
          },
          {
            text: "The best part about Mitra is how it connects the dots between different aspects of mental wellbeing. The app helped me understand how my diet and exercise habits were affecting my mood, and offered practical suggestions that fit my lifestyle.",
            name: "Yashvi Thakkar",
            position: "UX Designer",
            image: User
          }
        ];
      
        // Track which set of 3 testimonials is visible (0 or 3)
        const [testimonialIndex, setTestimonialIndex] = useState(0);
      
        const showNextTestimonials = () => {
          // Move from 0 to 3, or from 3 back to 0
          setTestimonialIndex((prev) => (prev + 3) % 6);
        };
      
        const showPrevTestimonials = () => {
          // Move from 0 to 3, or from 3 back to 0
          setTestimonialIndex((prev) => (prev - 3 + 6) % 6);
        };
      
        // Only show 3 testimonials based on the current index
        const visibleTestimonials = testimonialsData.slice(testimonialIndex, testimonialIndex + 3);
      
  const navigate = useNavigate();
  return (
    <div className="navbar-val">
    <Navbar/>
    <div className="app">
      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-text">
            <h2>Guiding You from Struggles to Strength, One Conversation at a Time</h2>
            <p>Mitra: A Gentle Whisper in the Storm, A Light in Your Darkest Hour</p>
            <button 
          className="px-6 py-3 bg-[#965ec7] text-white rounded-md transition-all duration-300 hover:bg-[#7a3fa9] hover:shadow-md"
          onClick={() => navigate("/chat-bot")}
        >Get Started</button>
          </div>
          <div className="hero-image">
            <img
              src= {image1}
              alt="Therapy session illustration"
            />
          </div>
        </div>


        {/* Services Section */}
        <div className="services-section" id="services">
          <div className="services-header">
            <h2>We provide you a variety of services</h2>
          </div>
          <div className="services-cards">
          <div className="service-card">
                      <div className="service-icon">
                        <img
                          src={test}
                          alt="Test icon"
                        />
                      </div>
                      <h3>Know Your MIND</h3>
                      <p>The 'Know Your Mind' test explores your psychological profile.</p>
                    </div>
        
                    <div className="service-card">
                      <div className="service-icon">
                        <img
                          src={heart}
                          alt="Self-care icon"
                        />
                      </div>
                      <h3>SELFCARE</h3>
                      <p>A structured self-care plan fosters balance through healthy habits, mindfulness, and growth.</p>
                    </div>
        
                    <div className="service-card">
                      <div className="service-icon">
                        <img
                          src={message}
                          alt="Chat icon"
                        />
                      </div>
                      <h3>MINDchat</h3>
                      <p>MindChat: Your Intelligent Companion for Mental Well-being & Self-Care.</p>
                    </div>
        
                    <div className="service-card">
                      <div className="service-icon">
                        <img
                          src={music}
                          alt="Music icon"
                        />
                      </div>
                      <h3>ZenBeats</h3>
                      <p>Your personalized studio that create musics to match your mood through captions and facial expressions.</p>
                    </div>
        
                  </div>
                </div>               
                  

        {/* Testimonials Section */}
        <div className="testimonials-header">
            <div className="title-group">
                <h2>See What Our Mitras Say About Us</h2>
            </div>
            <div className="testimonial-arrows">
              <button onClick={showPrevTestimonials} className="arrow-btn">‹</button>
              <button onClick={showNextTestimonials} className="arrow-btn">›</button>
            </div>
        </div>
          
        <div className="testimonials-container">
          {visibleTestimonials.map((testimonial, index) => (
          <div key={index} className="testimonial-card">
            <p className="testimonial-text">"{testimonial.text}"</p>
            <div className="testimonial-author">
                <img
                src={testimonial.image}
                alt={testimonial.name}
                className="author-image"
                />
              <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.position}</p>
              </div>
            </div>
          </div>
        ))}
        </div>

      </main>
    </div>
    </div>
  );
};

export default After_Login_Home;
