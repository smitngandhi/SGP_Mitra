// LogoutVideo.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

import login from "../assets/login_intro.mp4"
const LoginVideo = () => {
  const navigate = useNavigate();
  const [cookies, setCookie , removeCookie] = useCookies(["access_token"]);
  
  
          useEffect(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const accessTokenFromURL = urlParams.get("access_token");
          
                  // If token is in the URL and cookie isn't set yet
            if (accessTokenFromURL && !cookies.access_token) {
                    // console.log("Inside IF");
                    setCookie("access_token", accessTokenFromURL, { path: "/" });
                    console.log("Access token stored in cookies!");
                    localStorage.setItem("loginTime", Date.now());
                    // Remove token from URL
                    window.history.replaceState({}, document.title, window.location.pathname);
              }
                  }, [cookies.access_token, setCookie]);
          
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
      window.location.reload();
    }, 6000); // match video length

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-transparent overflow-hidden">
          <video
            autoPlay
            muted
            playsInline
            className="w-full"
          >
            <source src={login} type="video/mp4" />
          </video>
        </div>
  );
};

export default LoginVideo;