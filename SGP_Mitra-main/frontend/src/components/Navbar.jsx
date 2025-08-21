import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import "./animate.css";
import "../Navbar.css"
import Logoimg from '../assets/logotop.png'
import useLogout  from "../components/useLogout"
import SessionExpiredOverlay from "../components/SessionExpiredOverlay";

const Navbar = () => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);

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
  
  const handleLogout = useLogout(); // now reusable

useEffect(() => {
  const loginTime = localStorage.getItem("loginTime");
  if (!loginTime) return;

  const interval = setInterval(() => {
    const now = Date.now();
    if (now - loginTime > 10 * 1000) {
      // alert("Session expired, please login again.");
      localStorage.removeItem("loginTime");
      clearInterval(interval);  // ✅ Stop further checks
      setShowOverlay(true); // 👈 show overlay instead of alert
      handleLogout();
    }
  }, 1000); // check every second

  return () => clearInterval(interval); // cleanup on unmount
}, [handleLogout]);


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
    <nav className="flex justify-between items-center bg-white p-2">
  <div className="mx-auto  px-3  flex w-full">
    
    {/* Left: MITRA (Logo) */}
    <div onClick={handleMitraClick} className="cursor-pointer">
      <div><img className="logotopnav" src={Logoimg}></img></div>
      <div><h1 className="text-2xl font-bold text-indigo-600 animated-text">MITRA</h1></div>
    </div>

    {/* Right: Nav Links (Push to right with ml-auto) */}
    <div className="hidden md:flex items-center  space-x-5 ml-auto">
      <Link to="/assessment" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">Know Your Mind</Link>
      <Link to="/chat-bot" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">MindChat</Link>
      <Link to="/selfcare" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">SelfCare Plans</Link>
      <Link to="/music_generation" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">ZenBeats</Link>
      <Link to="/emergency" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">Emergency</Link>
      <Link to="/faqs" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">FAQs</Link>
      <Link to="/contact_us" className="text-gray-600 hover:text-[#7a3fa9] hover:font-semibold transition-colors duration-500">Contact Us</Link>
    </div>

    {/* Rightmost: Authentication Buttons (Login/Register or Username + Logout) */}
    <div className="flex items-center bg-white space-x-5 ml-6">
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : username ? (
        <div className="flex items-center space-x-4">
          <span className="text-[#7a3fa9] font-semibold hidden md:block"><Link to ="/profile">Hello, {username}</Link></span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-[#7a3fa9] text-white font-semibold rounded-md text-sm transition-all duration-300 hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <Link 
            to="/login" 
            className="px-4 py-2 border rounded-md transition-all duration-300 hover:bg-gray-200"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="px-4 py-2 bg-[#965ec7] text-white rounded-md transition-all duration-300 hover:bg-[#7a3fa9] hover:shadow-md"
          >
            Register
          </Link>
        </div>
      )}
    </div>

  </div>
</nav>
    </>
  );
};

export default Navbar;