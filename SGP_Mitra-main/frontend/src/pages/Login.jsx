import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import GoogleButton from "../components/GoogleButton";
import { Brain, Sparkles, ArrowRight } from "lucide-react";
import '../After_Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email_or_username, setEmail_or_username] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setCookie] = useCookies(["access_token"]);
  
  // Interactive motion gradient background
  const bgRef = useRef(null);
  const spotRef = useRef(null);
  
  useEffect(() => {
    const element = bgRef.current;
    const spot = spotRef.current;
    if (!element) return;

    let rafId;
    let currentX = 50;
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
      if (isCoarse) {
        time += 0.015;
        targetX = 50 + Math.cos(time) * 10;
        targetY = 40 + Math.sin(time * 0.9) * 8;
      }
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      setVars();
      const baseHalf = 210;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const loginData = {
      email_or_username: email_or_username,
      password: password,
    };

    try {
      const response = await fetch("http://13.211.214.231/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookie handling
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (response.ok) {
        setCookie("access_token", data.access_token, {
          path: "/",
          maxAge: 3600, // 1 hour
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax'
        });
        
        // Set login time for session management
        localStorage.setItem("loginTime", Date.now());
        console.log("Login time set in Login.jsx:", Date.now());

        try {
          const usernameResponse = await fetch("http://13.211.214.231/api/v1/get-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: data.access_token }),
          });

          const usernameData = await usernameResponse.json();
          if (usernameResponse.ok) {
            console.log("Username:", usernameData.username);
            navigate("/login-video");
          }
        } catch (usernameError) {
          console.error("Error fetching username:", usernameError);
        }
        // navigate("/home");
        console.log(data.msg);
      } else {
        setError(data.msg);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };




  return (
    <div className="min-h-screen text-gray-900 relative flex items-center justify-center px-4 pt-16">
      <div ref={bgRef} className="interactive-bg" />
      <div ref={spotRef} className="cursor-spot" />
      
      {/* Floating Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Circles */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}} />
        <div className="absolute top-32 right-16 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1s', animationDuration: '4s'}} />
        <div className="absolute top-48 left-1/4 w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-70 animate-ping" style={{animationDelay: '2s', animationDuration: '5s'}} />
        <div className="absolute top-28 right-1/3 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-40 animate-bounce" style={{animationDelay: '0.5s', animationDuration: '3.5s'}} />
        
        {/* Floating Brain Icons */}
        <div className="absolute top-16 right-20 opacity-20 animate-float">
          <Brain className="w-8 h-8 text-purple-500" />
        </div>
        <div className="absolute top-40 left-20 opacity-15 animate-float-delayed">
          <Sparkles className="w-6 h-6 text-blue-500" />
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-24 left-1/2 w-6 h-6 border-2 border-purple-300 opacity-30 animate-spin" style={{animationDuration: '8s'}} />
        <div className="absolute top-52 right-1/4 w-4 h-4 bg-gradient-to-r from-purple-300 to-blue-300 opacity-25 animate-pulse transform rotate-45" style={{animationDelay: '1.5s'}} />
        
        {/* Floating Text Elements */}
        <div className="absolute top-20 left-1/3 opacity-10 animate-float text-xs font-light text-purple-600">
          Mental Wellness
        </div>
        <div className="absolute top-44 right-1/3 opacity-10 animate-float-delayed text-xs font-light text-blue-600">
          AI Assistant
        </div>
      </div>
      
      <div className="w-full max-w-sm relative z-10">
        {/* Compact Text Branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
            <Sparkles className="w-10 h-10" />
            <span className="text-2xl font-bold">Welcome back</span>
          </div>
        </div>

        {/* Compact Login Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email or Username</label>
              <input
                type="text"
                placeholder="Enter your email or username"
                className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm"
                value={email_or_username}
                onChange={(e) => setEmail_or_username(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2.5 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 pr-10 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center">
                <input type="checkbox" className="w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                <span className="ml-1 text-gray-600">Remember</span>
              </label>
              <Link to="/forgot_password" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>
            
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-xs text-center">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>
          
          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-200" />
            <span className="px-3 text-gray-500 text-xs">or</span>
            <hr className="flex-1 border-gray-200" />
          </div>
          
          <GoogleButton text="Continue with Google" />
          
          <p className="text-center mt-4 text-gray-600 text-sm">
            New to  Mitra?{" "}
            <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;