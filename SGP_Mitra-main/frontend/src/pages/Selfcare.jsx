import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import '../Selfcare.css';
import music from '../assets/relax_music.mp3'

import personheart from '../assets/personheart.svg'
import person from '../assets/person.svg'
import house from '../assets/house.svg'
import chat from '../assets/chat.svg'

import test from "../assets/pencil-fill.svg"
import question from "../assets/question-circle.svg"


// Simple MeditationIcon placeholder
const MeditationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40" height="40">
    <circle cx="32" cy="32" r="30" fill="#6D5ED4" />
    <circle cx="32" cy="32" r="20" fill="#fff" />
  </svg>
);

const App = () => {

  const [username, setUsername] = useState("User"); // Default value
  const [cookies] = useCookies(["access_token"]); // Access cookies

      useEffect(() => {
        const fetchUsername = async () => {
          try {
            const response = await fetch("http://127.0.0.1:5000/api/v1/get-username", {
              method: "POST", // Use POST to send JSON data
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ access_token: cookies.access_token }), // Send cookie in JSON format
              credentials: "include", // Ensure cookies are sent with the request
            });

            if (!response.ok) {
              throw new Error("Failed to fetch username");
            }

            const data = await response.json();
            setUsername(data.username || "User"); // Fallback if no username
          } catch (error) {
            console.error("Error fetching username:", error);
          }
        };

        if (cookies.access_token) {
          fetchUsername();
        }
      }, [cookies.access_token]);
  // Popup states
  const [showJournal, setShowJournal] = useState(false);
  const [showRelaxationPopup, setShowRelaxationPopup] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [currentStepId, setCurrentStepId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  
  // Audio reference
  const audioRef = useRef(null);

  // Relaxation music tracks
  const relaxationTracks = [
    {
      name: "Peacefull Voice",
      description: "Calming ocean waves to help you relax and focus",
      src: music 
    },
  ];

  // Default steps configuration - with persistence
  const defaultSteps = [
    {
      id: 0,
      title: 'Meditation',
      link: '/meditation',
      completed: false,
      progress: 0,
    },
    {
      id: 1,
      title: 'Breathing Exercise',
      link: '/breathing',
      completed: false,
      progress: 0,
    },
    {
      id: 2,
      title: 'Gratitude Journaling',
      link: 'gratitude.html',
      completed: false,
      progress: 0,
    },
    {
      id: 3,
      title: 'Nature Exposure',
      link: '#',
      completed: false,
      progress: 0,
    },
    {
      id: 4,
      title: 'Relaxation Sound',
      link: '#',
      completed: false,
      progress: 0,
    },
  ];

  // Get today's date in YYYY-MM-DD format for storage keys
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Initialize steps with persisted data or default steps
  const [steps, setSteps] = useState(() => {
    const todayKey = getTodayDateString();
    const savedSteps = localStorage.getItem(`mindfulness_steps_${todayKey}`);
    
    if (savedSteps) {
      return JSON.parse(savedSteps);
    }
    
    // Check if we already completed steps for today
    const completionHistory = JSON.parse(localStorage.getItem('mindfulness_completion_history') || '{}');
    if (completionHistory[todayKey]) {
      // Already completed some steps today, use that data
      return completionHistory[todayKey];
    }
    
    return defaultSteps;
  });

  // Load calendar data from localStorage on mount
  const [calendarData, setCalendarData] = useState(() => {
    const savedCalendarData = localStorage.getItem('mindfulnessCalendar');
    if (savedCalendarData) {
      // Parse the saved data and ensure date objects are properly reconstructed
      const parsedData = JSON.parse(savedCalendarData, (key, value) => {
        if (key === 'date') {
          return new Date(value);
        }
        return value;
      });
      return parsedData;
    }
    
    // Default calendar if nothing in localStorage
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const daysArray = Array(daysInMonth)
      .fill()
      .map((_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
        const isBeforeToday = date < new Date(today.setHours(0, 0, 0, 0));
        const randomCompleted = isBeforeToday && Math.random() < 0.3;
        return { date, completed: randomCompleted };
      });
    return daysArray;
  });

  // Save steps to localStorage whenever they change
  useEffect(() => {
    const todayKey = getTodayDateString();
    localStorage.setItem(`mindfulness_steps_${todayKey}`, JSON.stringify(steps));
    
    // Also update completion history
    const completionHistory = JSON.parse(localStorage.getItem('mindfulness_completion_history') || '{}');
    completionHistory[todayKey] = steps;
    localStorage.setItem('mindfulness_completion_history', JSON.stringify(completionHistory));
  }, [steps]);

  // Save calendar data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mindfulnessCalendar', JSON.stringify(calendarData));
  }, [calendarData]);

  // Handle audio player effects
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Current streak state
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Calculate streaks from calendar data
  useEffect(() => {
    let streak = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    for (let i = calendarData.length - 1; i >= 0; i--) {
      const day = calendarData[i];
      if (day.completed) {
        streak++;
      } else if (day.date.getTime() < today) {
        break;
      }
    }
    setCurrentStreak(streak);

    let maxStreak = 0;
    let currentMaxStreak = 0;
    for (let i = 0; i < calendarData.length; i++) {
      if (calendarData[i].completed) {
        currentMaxStreak++;
        maxStreak = Math.max(maxStreak, currentMaxStreak);
      } else {
        currentMaxStreak = 0;
      }
    }
    setLongestStreak(maxStreak);
  }, [calendarData]);

  // Check if all tasks are completed for today - only mark once per day
  useEffect(() => {
    const allTasksCompleted = steps.every(step => step.completed);
    if (allTasksCompleted) {
      // Check if we already marked today as completed
      const todayString = new Date().toDateString();
      const lastCompletedDay = localStorage.getItem('lastCompletedDay');
      
      if (lastCompletedDay !== todayString) {
        setCalendarData(prev => {
          const newCalendar = [...prev];
          const todayIndex = newCalendar.findIndex(
            day => day.date.toDateString() === todayString
          );
          if (todayIndex !== -1 && !newCalendar[todayIndex].completed) {
            newCalendar[todayIndex].completed = true;
            // Store that we've completed today
            localStorage.setItem('lastCompletedDay', todayString);
          }
          return newCalendar;
        });
      }
    }
  }, [steps]);

  // Toggle completion of a step - Check if already completed for today
  const toggleStep = index => {
    const todayKey = getTodayDateString();
    const completionHistory = JSON.parse(localStorage.getItem('mindfulness_completion_history') || '{}');
    
    // If this specific step was already completed today, don't allow toggling again
    if (completionHistory[todayKey] && completionHistory[todayKey][index].completed) {
      return; // Already completed for today, do nothing
    }
    
    const newSteps = [...steps];
    const step = newSteps[index];
    step.completed = true; // Only allow completing, not uncompleting
    step.progress = 10;
    setSteps(newSteps);
  };

  // Open journal popup for a specific step
  const openJournal = stepId => {
    // Check if already completed for today
    const todayKey = getTodayDateString();
    const completionHistory = JSON.parse(localStorage.getItem('mindfulness_completion_history') || '{}');
    const stepIndex = steps.findIndex(step => step.id === stepId);
    
    if (completionHistory[todayKey] && 
        stepIndex !== -1 && 
        completionHistory[todayKey][stepIndex].completed) {
      return; // Already completed for today, do nothing
    }
    
    setCurrentStepId(stepId);
    setShowJournal(true);
  };

  // Open relaxation popup
  const openRelaxationPopup = () => {
    // Check if already completed for today
    const todayKey = getTodayDateString();
    const completionHistory = JSON.parse(localStorage.getItem('mindfulness_completion_history') || '{}');
    const relaxationIndex = steps.findIndex(step => step.title === 'Relaxation Sound');
    
    if (completionHistory[todayKey] && 
        relaxationIndex !== -1 && 
        completionHistory[todayKey][relaxationIndex].completed) {
      return; // Already completed for today, do nothing
    }
    
    setShowRelaxationPopup(true);
    // Set current track to the first one
    setCurrentTrack(0);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Change track
  const changeTrack = (index) => {
    setCurrentTrack(index);
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
    }
  };

  // Mark relaxation as complete
  const completeRelaxation = () => {
    const relaxationIndex = steps.findIndex(step => step.title === 'Relaxation Sound');
    if (relaxationIndex !== -1 && !steps[relaxationIndex].completed) {
      toggleStep(relaxationIndex);
    }
    setIsPlaying(false);
    setShowRelaxationPopup(false);
  };

  // Handle journal submission
  const handleJournalSubmit = () => {
    if (currentStepId !== null && journalText.trim() !== '') {
      // Save journal entry to localStorage
      const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '{}');
      const today = getTodayDateString();
      journalEntries[today] = journalEntries[today] || [];
      journalEntries[today].push({
        stepId: currentStepId,
        text: journalText,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
      
      // Mark the step as completed
      const stepIndex = steps.findIndex(step => step.id === currentStepId);
      if (stepIndex !== -1 && !steps[stepIndex].completed) {
        toggleStep(stepIndex);
      }
      
      // Reset and close journal
      setJournalText('');
      setShowJournal(false);
      setCurrentStepId(null);
    } else {
      setShowJournal(false);
    }
  };

  // Calculate overall plan progress
  const calculateOverallProgress = () => {
    const total = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round((total / (steps.length * 10)) * 100);
  };

  // Check if a step is disabled (already completed today)
  const isStepDisabled = (index) => {
    return steps[index].completed;
  };

  // Sidebar navigation items
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
      {/* LEFT SIDEBAR - STATIC NAVBAR */}
      <aside className="sidebar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        <h2 className="Mitra">MITRA</h2>
        <nav>
          <ul className="nav-list">
            {navItems.map((item, idx) => (
              <li key={idx} className={item.active ? 'active' : ''}>
                <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                  <img
                    src={item.icon}
                    alt={`${item.label} Logo`}
                    className="menu-logo"
                  />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* MAIN CONTENT - Add left margin to accommodate fixed sidebar */}
      <div className="main-content" style={{ marginLeft: '250px' }}>
        {/* TOP BAR (gradient) */}
        <div className="top-bar">
          <h1 style={{ margin: 0, fontSize: 20, color: '#333' }}>Welcome, {username ? username : "Rahul"}</h1>
          <span style={{ fontSize: 14, color: '#666' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Mindfulness & Relaxation Plan */}
        <section className="plan-section">
          <h2>Mindfulness &amp; Relaxation Plan</h2>
          <p>Plans especially designed for your wellness</p>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={step.id} className={`step-card ${step.completed ? 'completed' : ''}`}>
                <div className="image-container">
                  <MeditationIcon />
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <span className="step-name">{step.title}</span>
                    <span className="step-number">Step {index + 1}</span>
                  </div>
                  <div className="step-description">
                    Mindfulness activity to improve mental well-being
                  </div>
                  
                  {step.title === 'Gratitude Journaling' ? (
                    // Special handling for journaling activity
                    <>
                      {step.completed ? (
                        <button className="lets-start-btn" disabled>Completed</button>
                      ) : (
                        <button 
                          className="lets-start-btn" 
                          onClick={() => openJournal(step.id)}
                        >
                          Let's Start
                        </button>
                      )}
                    </>
                  ) : step.title === 'Relaxation Sound' ? (
                    // Special handling for relaxation sound
                    <>
                      {step.completed ? (
                        <button className="lets-start-btn" disabled>Completed</button>
                      ) : (
                        <button 
                          className="lets-start-btn" 
                          onClick={openRelaxationPopup}
                        >
                          Let's Start
                        </button>
                      )}
                    </>
                  ) : step.link === '/meditation' || step.link === '/breathing' ? (
                    // React Router links for internal navigation
                    <Link to={step.link} style={{ textDecoration: 'none' }}>
                      <button 
                        className="lets-start-btn" 
                        onClick={() => {
                          if (!step.completed) {
                            toggleStep(index);
                          }
                        }}
                        disabled={step.completed}
                      >
                        {step.completed ? 'Completed' : "Let's Start"}
                      </button>
                    </Link>
                  ) : (
                    // External links for other activities
                    <>
                      {step.completed ? (
                        <button className="lets-start-btn" disabled>Completed</button>
                      ) : (
                        <a href={step.link} style={{ textDecoration: 'none' }}>
                          <button
                            className="lets-start-btn" 
                            onClick={() => toggleStep(index)}
                          >
                            Let's Start
                          </button>
                        </a>
                      )}
                    </>
                  )}
                </div>
                {step.completed && <div className="completed-check">✔</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Track the Progress */}
        <section className="progress-tracking">
          <h2>Track the Progress</h2>
          <p>Track your task achievements and plan progresses here</p>
          <div className="progress-grid">
            {/* LEFT COLUMN: Plan & Task Progress */}
            <div className="progress-left">
              <div className="streak-container">
                <h3 className="progress-title">Your Mindfulness Streaks</h3>
                <div className="streak-info">
                  <div className="streak-card">
                    <div className="streak-value">{currentStreak}</div>
                    <div className="streak-label">Current Streak</div>
                  </div>
                  <div className="streak-card">
                    <div className="streak-value">{longestStreak}</div>
                    <div className="streak-label">Longest Streak</div>
                  </div>
                </div>
              </div>
              <div className="plan-progress-container">
                <h3 className="progress-title">Plan Progress</h3>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${calculateOverallProgress()}%` }}></div>
                </div>
                <span className="progress-percent">{calculateOverallProgress()}%</span>
              </div>
              <div className="task-progress-container">
                <h3 className="progress-title">Task Progress</h3>
                {steps.map((step) => (
                  <div key={step.id} className="task-item">
                    <span>{step.title}</span>
                    <div className="task-progress-wrapper">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(step.progress / 10) * 100}%` }}></div>
                      </div>
                      <div className="progress-bar-line" />
                    </div>
                    <span>{`${step.progress}/10`}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* RIGHT COLUMN: Calendar */}
            <div className="progress-right">
              <div className="calendar-container">
                <div className="calendar-header">
                  <h3 className="calendar-title">Mindfulness Streak</h3>
                </div>
                <p className="calendar-subtitle">
                  {calendarData.filter(day => day.completed).length} days completed this month
                </p>
                <div className="calendar-grid">
                  {calendarData.slice(-28).map((day, index) => (
                    <div
                      key={index}
                      className={`calendar-day ${day.completed ? '' : ''} ${
                        day.date.toDateString() === new Date().toDateString() ? 'today' : ''
                      }`}
                    >
                      <div className="calendar-date">{day.date.getDate()}</div>
                      {day.completed && <div className="calendar-status">✓</div>}
                    </div>
                  ))}
                </div>
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-color completed-day"></div>
                    <span>Completed</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color today"></div>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Journal Popup */}
        {showJournal && (
          <div className="journal-overlay">
            <div className="journal-popup">
              <div className="journal-header">
                <h3>Gratitude Journal</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowJournal(false)}
                >
                  ×
                </button>
              </div>
              <div className="journal-content">
                <p>Write down three things you're grateful for today:</p>
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="I am grateful for..."
                  rows={8}
                ></textarea>
                <button 
                  className="submit-button"
                  onClick={handleJournalSubmit}
                >
                  Save Journal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Relaxation Sound Popup */}
        {showRelaxationPopup && (
          <div className="journal-overlay">
            <div className="journal-popup" style={{ maxWidth: '500px' }}>
              <div className="journal-header">
                <h3>Relaxation Sounds</h3>
                <button 
                  className="close-button"
                  onClick={() => {
                    setIsPlaying(false);
                    setShowRelaxationPopup(false);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="journal-content">
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '16px', margin: '0 0 15px 0' }}>
                    Select a relaxing sound and take a few minutes to unwind and calm your mind.
                  </p>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>
                      Now playing: {relaxationTracks[currentTrack].name}
                    </h4>
                    <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
                      {relaxationTracks[currentTrack].description}
                    </p>
                    
                    {/* Audio element */}
                    <audio 
                      ref={audioRef}
                      src={relaxationTracks[currentTrack].src}
                      onEnded={() => {
                        const nextTrack = (currentTrack + 1) % relaxationTracks.length;
                        setCurrentTrack(nextTrack);
                      }}
                    />
                    
                    {/* Audio controls */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', margin: '20px 0' }}>
                      <button 
                        onClick={togglePlayPause}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '20px',
                          border: 'none',
                          background: '#6D5ED4',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                    </div>
                    
                    {/* Track selection */}
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>Select Track:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {relaxationTracks.map((track, idx) => (
                          <button
                            key={idx}
                            onClick={() => changeTrack(idx)}
                            style={{
                              padding: '10px',
                              borderRadius: '5px',
                              border: 'none',
                              background: currentTrack === idx ? '#E0D9FF' : '#f0f0f0',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ 
                              marginRight: '10px', 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              background: currentTrack === idx ? '#6D5ED4' : '#ddd',
                              display: 'inline-block'
                            }}></span>
                            {track.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    className="submit-button"
                    onClick={completeRelaxation}
                    style={{
                      marginTop: '20px',
                      padding: '12px 25px',
                      background: '#6D5ED4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Complete Relaxation Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;