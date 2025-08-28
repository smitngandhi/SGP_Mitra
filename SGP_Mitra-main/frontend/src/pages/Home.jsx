import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import User from '../assets/User.png'
import React, { useEffect, useRef, useState } from 'react';
import '../After_Login.css';
import { useCookies } from "react-cookie";
import { Brain, Heart, MessageSquare, Music, Download, Sparkles, Shield, Zap } from "lucide-react";
import Lottie from 'lottie-react';
import DoctorAnimation from '../assets/Doctor.json';
// Optional subtle video background (place `intro.mp4` in public/ if desired)

const Home = () => {

        const [cookies, setCookie] = useCookies(["access_token"]);




        const texts = [
          "Find peace in your daily routine",
          "Your mental health matters most",
          "Small steps lead to big changes",
          "Balance mind, body, and soul",
          "Wellness begins with you",
        ];

        const [index, setIndex] = useState(0);

        useEffect(() => {
          const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % texts.length);
          }, 10000); // change every 10 seconds
          return () => clearInterval(interval);
        }, []);


        
        useEffect(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const accessTokenFromURL = urlParams.get("access_token");

          if (accessTokenFromURL && !cookies.access_token) {
              console.log("Inside")
              setCookie("access_token", accessTokenFromURL, {
                  path: "/",
                  maxAge : 3600
              });

              console.log("Access token stored in cookies!");

              // Remove the access_token from the URL
              const newURL = window.location.pathname;
              window.history.replaceState({}, document.title, newURL);
          }
        }, [cookies.access_token, setCookie]);

        // Scroll reveal animations using IntersectionObserver
        useEffect(() => {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('animate-in');
                }
              });
            },
            { threshold: 0.15 }
          );

          const revealElements = document.querySelectorAll('.reveal');
          revealElements.forEach((el) => observer.observe(el));

          return () => observer.disconnect();
        }, []);

        // Interactive motion gradient background
        const bgRef = useRef(null);
        const spotRef = useRef(null);
        useEffect(() => {
          const element = bgRef.current;
          const spot = spotRef.current;
          if (!element) return;

          let rafId;
          let currentX = 50; // percentage
          let currentY = 40;
          let targetX = 50;
          let targetY = 40;
          const isCoarse = window.matchMedia('(pointer: coarse)').matches;

          const setVars = () => {
            element.style.setProperty('--mx', currentX + '%');
            element.style.setProperty('--my', currentY + '%');
          };

          let time = 0;
          const loop = () => {
            // On touch devices, gently move target in idle
            if (isCoarse) {
              time += 0.015;
              targetX = 50 + Math.cos(time) * 10;
              targetY = 40 + Math.sin(time * 0.9) * 8;
            }
            // Lerp towards target for smoothness
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            setVars();
            const baseHalf = 210; // half of 420px
            const px = (currentX / 100) * window.innerWidth - baseHalf;
            const py = (currentY / 100) * window.innerHeight - baseHalf;
            if (spot) spot.style.transform = `translate3d(${px}px, ${py}px, 0)`;
            rafId = requestAnimationFrame(loop);
          };

          const handlePointerMove = (e) => {
            targetX = (e.clientX / window.innerWidth) * 100;
            targetY = (e.clientY / window.innerHeight) * 100;
          };
          const handleMouseMove = (e) => {
            targetX = (e.clientX / window.innerWidth) * 100;
            targetY = (e.clientY / window.innerHeight) * 100;
          };
          const handleTouchMove = (e) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            targetX = (t.clientX / window.innerWidth) * 100;
            targetY = (t.clientY / window.innerHeight) * 100;
          };

          window.addEventListener('pointermove', handlePointerMove, { passive: true });
          window.addEventListener('mousemove', handleMouseMove, { passive: true });
          window.addEventListener('touchmove', handleTouchMove, { passive: true });
          loop();

          return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
          };
        }, []);

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
      
        // Testimonials slider (auto + swipe + arrows)
        const [testimonialIndex, setTestimonialIndex] = useState(0);
        const total = testimonialsData.length;
        const itemsPerSlide = 3;
        const maxIndex = Math.ceil(total / itemsPerSlide) - 1; // 1 for 6 items
        const sliderRef = useRef(null);
        const touchStartXRef = useRef(null);

        const showNextTestimonials = () => {
          setTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        };

        const showPrevTestimonials = () => {
          setTestimonialIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
        };

        useEffect(() => {
          const interval = setInterval(() => {
            showNextTestimonials();
          }, 5000);
          return () => clearInterval(interval);
        }, [maxIndex]);

        const handleTouchStart = (e) => {
          touchStartXRef.current = e.touches[0].clientX;
        };

        const handleTouchEnd = (e) => {
          if (touchStartXRef.current === null) return;
          const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
          if (Math.abs(deltaX) > 50) {
            if (deltaX < 0) {
              showNextTestimonials();
            } else {
              showPrevTestimonials();
            }
          }
          touchStartXRef.current = null;
        };

        const visibleTestimonials = testimonialsData.slice(
          testimonialIndex * itemsPerSlide,
          testimonialIndex * itemsPerSlide + itemsPerSlide
        );
      
  const navigate = useNavigate();
  return (
    <div className="min-h-screen text-gray-900 relative">
      <div ref={bgRef} className="interactive-bg" />
      <div ref={spotRef} className="cursor-spot" />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 md:pt-32 pb-32" >
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-30 animate-bounce" />
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full opacity-25" />
        
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center min-h-[70vh]">
            {/* Left side - Text Content (2/3) */}
            <div className="lg:col-span-2 reveal text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-6">
                <Sparkles size={16} />
                An Excellent Application For Your Contemporary Lifestyle
              </div>
              <h1 className="font-display font-black text-[40px] md:text-[60px] lg:text-[72px] leading-[0.9] bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent mb-6">
                Transform Your
                <br />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Mental Wellness
                </span>
              </h1>
              <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed max-w-2xl">
              {texts[index]}
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/chat-bot')}
                  className="hero-primary-btn"
                >
                  <Download size={20} />
                  Get Started
                </button>
                <button
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hero-secondary-btn"
                >
                  Explore Services
                </button>
              </div>
            </div>

            {/* Right side - Lottie Animation (1/3) */}
            <div className="lg:col-span-1 relative reveal flex justify-center lg:justify-end">
              <div className="relative">
                <div className="lottie-container-compact">
                  <Lottie 
                    animationData={DoctorAnimation} 
                    className="lottie-animation"
                    loop={true}
                    autoplay={true}
                  />
                </div>
                {/* Floating decorative elements around animation */}
                <div className="absolute -top-6 -left-6 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-400 rounded-full opacity-60 animate-ping" />
                <div className="absolute -bottom-3 -right-4 w-3 h-3 bg-gradient-to-br from-green-400 to-blue-400 rounded-full opacity-50 animate-pulse" />
                <div className="absolute top-1/2 -left-8 w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-40" />
                <div className="absolute top-1/4 -right-6 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-45 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section-soft py-20">
        <div className="container mx-auto px-6 md:px-10">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-gray-900 to-purple-800 bg-clip-text text-transparent mb-4">
              Services to support your wellbeing
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our comprehensive suite of mental wellness tools designed for your journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[{
              icon: Brain,
              title: 'Know Your Mind',
              desc: "Explore your psychological profile with science-backed assessments.",
              path: '/assessment',
              gradient: 'from-purple-500 to-pink-500',
              bgGradient: 'from-purple-50 to-pink-50'
            },{
              icon: Heart,
              title: 'SelfCare',
              desc: 'Structured plans to foster balance, mindfulness, and growth.',
              path: '/selfcare',
              gradient: 'from-red-500 to-orange-500',
              bgGradient: 'from-red-50 to-orange-50'
            },{
              icon: MessageSquare,
              title: 'MindChat',
              desc: 'Your intelligent companion for mental wellbeing and support.',
              path: '/chat-bot',
              gradient: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-50 to-cyan-50'
            },{
              icon: Music,
              title: 'ZenBeats',
              desc: 'Personalized music that resonates with your current mood.',
              path: '/music_generation',
              gradient: 'from-green-500 to-emerald-500',
              bgGradient: 'from-green-50 to-emerald-50'
            }].map((card, idx) => (
              <button key={idx} onClick={() => navigate(card.path)} className="glassmorphism-card text-left reveal group">
                <div className={`service-gradient-icon bg-gradient-to-br ${card.gradient}`}>
                  {card.icon && <card.icon size={28} strokeWidth={2} className="text-white" />}
                </div>
                <h3 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">{card.title}</h3>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                <div className="mt-4 flex items-center text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <Zap size={16} className="ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      

      {/* Testimonials */}
      {/* Testimonials - Enhanced Floating Windows */}
      <section className="container mx-auto px-6 md:px-10 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">What our Mitras say</h2>
          <p className="text-gray-600 text-lg">Floating experiences from our community</p>
        </div>

        <div className="testimonials-container">
          <div className="testimonials-floating-track">
            {/* First set of testimonials */}
            {testimonialsData.map((testimonial, index) => (
              <div key={`first-${index}`} className="testimonial-floating-card reveal">
                <div className="testimonial-profile">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.position}</p>
                  </div>
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
              </div>
            ))}
            {/* Duplicate set for seamless scrolling */}
            {testimonialsData.map((testimonial, index) => (
              <div key={`second-${index}`} className="testimonial-floating-card reveal">
                <div className="testimonial-profile">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.position}</p>
                  </div>
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Optional: Add navigation dots */}
        <div className="testimonials-nav">
          {testimonialsData.map((_, index) => (
            <div key={index} className={`testimonial-dot ${index === 0 ? 'active' : ''}`}></div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 -z-10 cta-gradient" />
        <div className="container mx-auto px-6 md:px-10 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Ready to take the first step?</h3>
          <p className="mt-3 text-gray-600">Start a conversation with Mitra today.</p>
          <div className="mt-8 flex justify-center gap-4">
            <button className="btn-primary" onClick={() => navigate('/register')}>Create Account</button>
            <button className="btn-secondary" onClick={() => navigate('/chat-bot')}>Try MindChat</button>
          </div>
        </div>
      </section>

      {/* <Footer /> */}
    </div>
  );
};

export default Home;
