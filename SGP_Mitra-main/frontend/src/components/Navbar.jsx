import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import "./animate.css";
import "../Navbar.css"
import logo from '../assets/Mitra Logo.png'
import Logoimg from '../assets/logotop.png'

const Navbar = () => {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookie, removeCookie] = useCookies(["access_token"]);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    removeCookie("access_token", { path: "/" });
    setUsername(null);
    navigate("/login");
  };

  const handleMitraClick = () => {
    if (cookies.access_token) {
      navigate("/home");
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto px-4 md:px-6">
          <div className="glass-nav mt-2 flex items-center w-full rounded-2xl">
            {/* Left: MITRA (Logo) */}
            <div onClick={handleMitraClick} className="cursor-pointer">
              <div><img className="logotopnav" src={Logoimg}></img></div>
              <div><h1 className="text-2xl font-bold text-indigo-600 animated-text">MITRA</h1></div>
            </div>

            {/* Right: Nav Links (Push to right with ml-auto) */}
            <div className="hidden md:flex items-center space-x-6 ml-auto">
              <Link to="/assessment" className="nav-link">Know Your Mind</Link>
              <Link to="/chat-bot" className="nav-link">MindChat</Link>
              <Link to="/selfcare" className="nav-link">SelfCare Plans</Link>
              <Link to="/music_generation" className="nav-link">ZenBeats</Link>
              <Link to="/faqs" className="nav-link">FAQs</Link>
              <Link to="/contact_us" className="nav-link">Contact Us</Link>
            </div>

            {/* Rightmost: Authentication Buttons (Login/Register or Username + Logout) */}
            <div className="hidden md:flex items-center space-x-4 ml-6">
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : username ? (
                <div className="flex items-center space-x-4">
                  <span className="text-[#7a3fa9] font-semibold"><Link to ="/profile">Hello, {username}</Link></span>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-[#8A5DD6] text-white transition-all duration-300 hover:shadow-glow hover:scale-[1.02]"
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