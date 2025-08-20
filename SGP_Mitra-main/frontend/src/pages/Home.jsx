import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import User from '../assets/User.png'
import React, { useEffect, useRef, useState } from 'react';
import './home.css';
import { useCookies } from "react-cookie";
import { Brain, Heart, MessageSquare, Music } from "lucide-react";
// Optional subtle video background (place `intro.mp4` in public/ if desired)

const Home = () => {

        const [cookies, setCookie] = useCookies(["access_token"]);

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
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 md:pt-28 pb-24" style={{marginTop: '96px'}}>
        {/* Optional subtle video background (uncomment if using) */}
        {/* <video className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" autoPlay loop muted playsInline src="/intro.mp4" /> */}

        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="reveal">
              <h1 className="font-display font-extrabold text-[40px] md:text-[56px] leading-tight text-gray-900">
                Guiding you from struggles to strength, one conversation at a time
              </h1>
              <p className="mt-4 text-gray-600 text-lg md:text-xl max-w-xl">
                Mitra: a gentle whisper in the storm, a light in your darkest hour.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/chat-bot')}
                  className="btn-primary"
                >
                  Get Started
                </button>
                <button
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary"
                >
                  Explore Services
                </button>
              </div>
            </div>

            <div className="relative reveal">
              <div className="parallax-card" />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="section-soft">
        <div className="container mx-auto px-6 md:px-10 py-16">
        <h2 className="reveal text-3xl md:text-5xl font-bold text-[#111827] mb-10">Services to support your wellbeing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[{
            icon: Brain,
            title: 'Know Your Mind',
            desc: "Explore your psychological profile with science-backed assessments.",
            path: '/assessment'
          },{
            icon: Heart,
            title: 'SelfCare',
            desc: 'Structured plans to foster balance, mindfulness, and growth.',
            path: '/selfcare'
          },{
            icon: MessageSquare,
            title: 'MindChat',
            desc: 'Your intelligent companion for mental wellbeing and support.',
            path: '/chat-bot'
          },{
            icon: Music,
            title: 'ZenBeats',
            desc: 'Personalized music that resonates with your current mood.',
            path: '/music_generation'
          }].map((card, idx) => (
            <button key={idx} onClick={() => navigate(card.path)} className="service-flat-card text-left reveal">
              <div className="service-flat-icon">
                {card.icon && <card.icon size={26} strokeWidth={2} />}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[#111827]">{card.title}</h3>
              <p className="mt-1.5 text-[#6B7280] text-sm leading-relaxed">{card.desc}</p>
            </button>
          ))}
        </div>
        </div>
      </section>

      

      {/* Testimonials */}
      <section className="container mx-auto px-6 md:px-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">What our Mitras say</h2>
          <div className="flex gap-3">
            <button onClick={showPrevTestimonials} className="nav-arrow" aria-label="Previous">‹</button>
            <button onClick={showNextTestimonials} className="nav-arrow" aria-label="Next">›</button>
          </div>
        </div>

        <div
          ref={sliderRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {visibleTestimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card reveal">
              <div className="flex flex-col items-start">
                <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover mb-3" />
                <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                <p className="text-sm text-gray-500">{testimonial.position}</p>
              </div>
              <p className="mt-4 text-gray-700">“{testimonial.text}”</p>
            </div>
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

      <Footer />
    </div>
  );
};

export default Home;
