import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "../components/GoogleButton";
import { Eye, EyeOff, Mail, Lock, User, UserCheck, ArrowRight, Shield, Zap, Users } from "lucide-react";
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

  // Interactive background animation
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

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Reveal animations
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
      const response = await fetch("http://127.0.0.1:5000/api/v1/register", {
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
    <div className="min-h-screen text-gray-900 relative overflow-hidden">
      <div ref={bgRef} className="interactive-bg" />
      <div ref={spotRef} className="cursor-spot" />

      {/* Proper spacing for fixed navbar - 96px accounts for navbar height + margin */}
      <div className="flex items-center justify-center min-h-screen relative z-10 px-4 pt-24 py-8">
        <div className="glass-card max-w-6xl w-full flex overflow-hidden">
          {/* Left Section - CSS-based Design */}
          <div className="hidden lg:flex w-1/2 items-center justify-center p-8 relative">
            <div className="reveal w-full max-w-md">
              {/* Animated CSS Design */}
              <div className="relative">
                {/* Main Hexagonal Pattern */}
                <div className="w-80 h-80 mx-auto relative">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#8A5DD6] via-[#A8D8FF] to-[#B2F7EF] opacity-15 animate-pulse transform rotate-12"></div>
                  <div className="absolute inset-6 rounded-2xl bg-gradient-to-tl from-[#8A5DD6]/20 to-[#B2F7EF]/20 backdrop-blur-sm transform -rotate-6"></div>

                  {/* Central Feature Icons */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Center Shield Icon for Security */}
                      <div className="w-20 h-20 bg-white/95 rounded-2xl flex items-center justify-center shadow-xl border border-white/50">
                        <Shield className="w-10 h-10 text-[#8A5DD6]" />
                      </div>

                      {/* Floating Feature Icons */}
                      <div className="absolute -top-12 -right-10 w-14 h-14 bg-gradient-to-r from-[#A8D8FF] to-[#B2F7EF] rounded-xl flex items-center justify-center shadow-lg animate-bounce transform rotate-12" style={{ animationDelay: '0.5s' }}>
                        <Zap className="w-7 h-7 text-white" />
                      </div>

                      <div className="absolute -bottom-8 -left-8 w-12 h-12 bg-gradient-to-r from-[#8A5DD6] to-[#A8D8FF] rounded-xl flex items-center justify-center shadow-lg animate-bounce transform -rotate-12" style={{ animationDelay: '1s' }}>
                        <Users className="w-6 h-6 text-white" />
                      </div>

                      {/* Geometric floating elements */}
                      <div className="absolute top-16 -left-16 w-8 h-8 bg-[#B2F7EF]/60 rounded-lg animate-pulse transform rotate-45 opacity-70"></div>
                      <div className="absolute -top-6 left-20 w-6 h-6 bg-[#A8D8FF]/70 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.3s' }}></div>
                      <div className="absolute bottom-12 right-16 w-10 h-10 bg-[#8A5DD6]/30 rounded-xl animate-pulse transform rotate-12 opacity-60" style={{ animationDelay: '0.8s' }}></div>
                      <div className="absolute top-8 right-20 w-4 h-4 bg-[#B2F7EF] rounded-full animate-pulse opacity-50" style={{ animationDelay: '1.2s' }}></div>
                    </div>
                  </div>

                  {/* Animated Geometric Shapes */}
                  <div className="absolute inset-10 border-2 border-[#8A5DD6]/15 rounded-2xl animate-spin transform rotate-45" style={{ animationDuration: '10s' }}></div>
                  <div className="absolute inset-16 border border-[#A8D8FF]/25 rounded-xl animate-spin transform -rotate-12" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
                  <div className="absolute inset-20 border border-[#B2F7EF]/20 rounded-lg animate-spin" style={{ animationDuration: '20s' }}></div>
                </div>

                {/* Welcome Text */}
                <div className="text-center mt-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Join the Mitra Community</h3>
                  <p className="text-gray-600 mb-4">Start your journey to better mental wellness</p>

                  {/* Feature highlights */}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#8A5DD6] rounded-full"></div>
                      <span>AI-Powered Support</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#A8D8FF] rounded-full"></div>
                      <span>Personalized Care Plans</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-[#B2F7EF] rounded-full"></div>
                      <span>24/7 Availability</span>
                    </div>
                  </div>

                  {/* Animated dots */}
                  <div className="flex justify-center space-x-2 mt-6">
                    <div className="w-2 h-2 bg-[#8A5DD6] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#A8D8FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#B2F7EF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Registration Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            <div className="reveal">
              <div className="text-center mb-8">
                <h1 className="font-display font-bold text-4xl lg:text-5xl text-gray-900 mb-2">
                  Join Mitra
                </h1>
                <p className="text-xl text-[#8A5DD6] font-semibold mb-1">
                  Your Wellness Journey Starts Here
                </p>
                <p className="text-gray-600">
                  Create your account and begin your path to better mental health
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name Field */}
                <div className="reveal">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#8A5DD6]/20 focus:border-[#8A5DD6] 
                               transition-all duration-300 backdrop-blur-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Username Field */}
                <div className="reveal">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserCheck className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Choose a unique username"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#8A5DD6]/20 focus:border-[#8A5DD6] 
                               transition-all duration-300 backdrop-blur-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="reveal">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#8A5DD6]/20 focus:border-[#8A5DD6] 
                               transition-all duration-300 backdrop-blur-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="reveal">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="w-full pl-12 pr-12 py-3 bg-white/70 border border-gray-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#8A5DD6]/20 focus:border-[#8A5DD6] 
                               transition-all duration-300 backdrop-blur-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#8A5DD6] transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-[#8A5DD6] transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 reveal">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Terms and Privacy */}
                <div className="reveal">
                  <p className="text-xs text-gray-500 text-center">
                    By creating an account, you agree to our{" "}
                    <Link to="/terms" className="text-[#8A5DD6] hover:text-[#7a3fa9] transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-[#8A5DD6] hover:text-[#7a3fa9] transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  className="w-full btn-primary py-3 text-base font-semibold reveal group"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center my-6 reveal">
                  <hr className="flex-1 border-gray-300" />
                  <span className="px-4 text-gray-500 text-sm">or continue with</span>
                  <hr className="flex-1 border-gray-300" />
                </div>

                {/* Google Button */}
                <div className="reveal">
                  <GoogleButton text="Sign up with Google" />
                </div>

                {/* Login Link */}
                <p className="text-center text-gray-600 reveal">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-[#8A5DD6] font-semibold hover:text-[#7a3fa9] transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;