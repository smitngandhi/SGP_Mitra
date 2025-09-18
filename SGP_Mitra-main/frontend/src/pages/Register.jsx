import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "../components/GoogleButton";
import { Sparkles, ArrowRight, UserPlus } from "lucide-react";
import '../After_Login.css';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
    setError("");

    const userData = {
      full_name: fullName,
      username: username,
      email: email,
      password: password,
    };

    try {
      const response = await fetch("http://13.211.214.231/api/v1/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(data.msg);
        navigate("/");
      } else {
        setError(data.msg);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <UserPlus className="w-8 h-8 text-purple-500" />
        </div>
        <div className="absolute top-40 left-20 opacity-15 animate-float-delayed">
          <Sparkles className="w-6 h-6 text-blue-500" />
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-24 left-1/2 w-6 h-6 border-2 border-purple-300 opacity-30 animate-spin" style={{animationDuration: '8s'}} />
        <div className="absolute top-52 right-1/4 w-4 h-4 bg-gradient-to-r from-purple-300 to-blue-300 opacity-25 animate-pulse transform rotate-45" style={{animationDelay: '1.5s'}} />
        
        {/* Floating Text Elements */}
        <div className="absolute top-20 left-1/3 opacity-10 animate-float text-xs font-light text-purple-600">
          Join Mitra
        </div>
        <div className="absolute top-44 right-1/3 opacity-10 animate-float-delayed text-xs font-light text-blue-600">
          Wellness Journey
        </div>
      </div>
      
      <div className="w-full max-w-sm relative z-10">
        {/* Compact Text Branding */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
            <Sparkles className="w-10 h-10" />
            <span className="text-2xl font-bold">Join Today</span>
          </div>
        </div>

        {/* Compact Register Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                placeholder="Choose a unique username"
                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 pr-10 text-sm"
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
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Create Account
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
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
