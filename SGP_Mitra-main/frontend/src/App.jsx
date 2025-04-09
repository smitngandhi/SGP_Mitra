import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./pages/Chatbot";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FAQS from "./pages/FAQs";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import After_Login_Home from "./pages/After_Login_Home";
import Profile from "./pages/Profile";
import Test from "./pages/Test";
import ContactUs from "./pages/Contact_Us";
import Selfcare from "./pages/Selfcare";
import Meditation from "./pages/Meditation";
import Breathing from "./pages/Breathing";
import Music_Generation from "./pages/Music_Generation";
import VideoIntro from "./components/VideoIntro";
import Chatbotnew from "./pages/Chatbotnew";
const App = () => {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <>
      {!introFinished ? (
        <VideoIntro onFinish={() => setIntroFinished(true)} />
      ) : (
        <>
          {/* Optional: <Navbar /> */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<After_Login_Home />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="/music_generation" element={<Music_Generation />} />
          </Routes>
          {/* <Footer /> */}
        </>
      )}
    </>
  );
};

export default App;
