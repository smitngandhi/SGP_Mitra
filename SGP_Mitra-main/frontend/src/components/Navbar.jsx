import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import "./animate.css";
import "../Navbar.css";
import Logoimg from "../assets/logotop.png";
import useLogout from "../components/useLogout"; // ✅ Reusable logout hook
import SessionExpiredOverlay from "../components/SessionExpiredOverlay";

const Navbar = () => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const [showOverlay, setShowOverlay] = useState(false); // ✅ Now modular & reusable
  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ Fetch Username from backend
  useEffect(() => {
    const fetchUsername = async () => {
      if (cookies.access_token) {
        try {
          const response = await fetch("http://127.0.0.1:5000/api/v1/get-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: cookies.access_token }),
          });

          const data = await response.json();
          if (response.ok) {
            setUsername(data.username);
          } else {
            setUsername(null);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
          setUsername(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUsername();
  }, [cookies.access_token]);

  // ✅ Scroll detection for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50); // Trigger after 50px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Session auto-expiry (1 hour)
  useEffect(() => {
  const loginTime = localStorage.getItem("loginTime");
  console.log("Login Time:", loginTime);
  
  if (!loginTime) return;

  const interval = setInterval(() => {
    const now = Date.now();
    console.log("Current Time:", now, "Login Time:", loginTime);
    if (now - loginTime > 3600 * 1000) {
      // alert("Session expired, please login again.");
      localStorage.removeItem("loginTime");
      clearInterval(interval);  // ✅ Stop further checks
      setShowOverlay(true); // 👈 show overlay instead of alert
      handleLogout();
    }
  }, 1000); // check every second

  return () => clearInterval(interval); // cleanup on unmount
  }, [handleLogout]);

  // ✅ Logo click navigation
  const handleMitraClick = () => {
    if (cookies.access_token) {
      navigate("/home");
    } else {
      navigate("/");
    }
  };

  return (
    <>
     {showOverlay && (
        <SessionExpiredOverlay onFinish={() => navigate("/logout-video")} />
      )}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className={`mx-auto transition-all duration-300 ${
          isScrolled ? 'px-4 md:px-6' : 'px-0'
        }`}>
          <div className={`glass-nav flex items-center w-full transition-all duration-300 ${
            isScrolled ? 'mt-2 rounded-2xl' : 'mt-0 rounded-none'
          }`}>
            {/* Left: MITRA (Logo) */}
            <div onClick={handleMitraClick} className="cursor-pointer">
              <div>
                <img className="logotopnav" src={Logoimg} alt="Mitra Logo" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-indigo-600 animated-text">
                  MITRA
                </h1>
              </div>
            </div>

            {/* Right: Nav Links */}
            <div className="hidden md:flex items-center space-x-6 ml-auto">
              <Link to="/assessment" className="nav-link">
                Know Your Mind
              </Link>
              <Link to="/chat-bot" className="nav-link">
                MindChat
              </Link>
              <Link to="/selfcare" className="nav-link">
                SelfCare Plans
              </Link>
              <Link to="/music_generation" className="nav-link">
                ZenBeats
              </Link>
              <Link to="/emergency" className="nav-link">
                Emergency
              </Link>
              <Link to="/faqs" className="nav-link">
                FAQs
              </Link>
              <Link to="/contact_us" className="nav-link">
                Contact Us
              </Link>
            </div>

            {/* Rightmost: Authentication Buttons */}
            <div className="hidden md:flex items-center space-x-4 ml-6">
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : username ? (
                <div className="flex items-center space-x-4">
                  <span className="text-[#7a3fa9] font-semibold hidden md:block">
                    <Link to="/profile">Hello, {username}</Link>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-[#8A5DD6] text-white transition-all duration-300 hover:shadow-glow hover:scale-[1.02] hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="btn-secondary px-4 py-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary px-4 py-2"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;