import React, { useState } from "react";
import { Routes, Route, useLocation  } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FAQS from "./pages/FAQs";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AFTER_LOGIN_HOME from "./pages/After_Login_Home";
import Profile from "./pages/Profile";
import Test from "./pages/Test";
import ContactUs from "./pages/Contact_Us";
import Selfcare from "./pages/Selfcare";
import Meditation from "./pages/Meditation";
import Breathing from "./pages/Breathing";
import MUSIC_GENERATION from "./pages/Music_Generation";
import VideoIntro from "./components/VideoIntro";
import Chatbotnew from "./pages/Chatbotnew";
import VoiceAssistantModel from "./pages/VoiceAssistantModel";
import AssessmentTestPage from "./pages/AssessmentTestPage";
import Emergencypage from "./pages/emergency";
import usePageTracking from "./components/usePageTracking";
import { useCookies } from "react-cookie";
import LogoutVideo from "./components/LogoutVideo";
import LoginVideo from "./components/LoginVideo";
import ChatbotWidget from "./components/ChatbotWidget";

const App = () => {
  const [introFinished, setIntroFinished] = useState(false);
  const [cookies] = useCookies(["access_token"]);
  const isLoggedIn = Boolean(cookies.access_token);
  const location = useLocation();
  const hideNavbarRoutes = ["/logout-video", "/login-video"];

  const shouldHideNavbar = hideNavbarRoutes.some(route =>
    location.pathname.startsWith(route)
  );  
  usePageTracking(isLoggedIn);
  return (
    <>
    
      {!introFinished ? (
        <VideoIntro onFinish={() => setIntroFinished(true)} />
      ) : (
        <>
          {!shouldHideNavbar && <Navbar />}
          <Routes>
            <Route path="/" element={<AFTER_LOGIN_HOME/>} />
            <Route path="/home" element={<AFTER_LOGIN_HOME />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout-video" element={<LogoutVideo />} />
            <Route path="/login-video" element={<LoginVideo />} />
            <Route path="/chat-bot" element={<Chatbotnew />} />
            <Route path="/register" element={<Register />} />
            <Route path="/faqs" element={<FAQS />} />
            <Route path="/forgot_password" element={<ForgotPassword />} />
            <Route path="/reset_password/:token" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/test" element={<Test />} />
            <Route path="/contact_us" element={<ContactUs />} />
            <Route path="/selfcare" element={<Selfcare />} />
            <Route path="/meditation" element={<Meditation />} />
            <Route path="/breathing" element={<Breathing />} />
            <Route path="/music_generation" element={<MUSIC_GENERATION />} />
            <Route path="/voice_assistant" element={<VoiceAssistantModel  />} />
            <Route path="/assessment" element={<AssessmentTestPage  />} />
            <Route path="/emergency" element={<Emergencypage  />} />
          </Routes>
        
        {!shouldHideNavbar && <ChatbotWidget />}

        </>
      )}
    </>
  );
};

export default App;
