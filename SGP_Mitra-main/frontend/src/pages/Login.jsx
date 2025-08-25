import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import GoogleButton from "../components/GoogleButton";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Brain, Heart, Sparkles } from "lucide-react";
import '../After_Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email_or_username, setEmail_or_username] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setCookie] = useCookies(["access_token"]);

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

    const loginData = {
      email_or_username: email_or_username,
      password: password,
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (response.ok) {
        setCookie("access_token", data.access_token, {
          path: "/",
        });

        try {
          const usernameResponse = await fetch("http://127.0.0.1:5000/api/v1/get-username", {
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
    <div className="min-h-screen text-gray-900 relative overflow-hidden">
      <div ref={bgRef} className="interactive-bg" />
      <div ref={spotRef} className="cursor-spot" />

      {/* Proper spacing for fixed navbar - 96px accounts for navbar height + margin */}
      <div className="flex items-center justify-center min-h-screen relative z-10 px-4 pt-24">
        <div className="glass-card max-w-5xl w-full flex overflow-hidden">
          {/* Left Section - CSS-based Design */}
          <div className="hidden lg:flex w-1/2 items-center justify-center p-8 relative">
            <div className="reveal w-full max-w-md">
              {/* Animated CSS Design */}
              <div className="relative">
                {/* Main Circle with Gradient */}
                <div className="w-80 h-80 mx-auto relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8A5DD6] via-[#A8D8FF] to-[#B2F7EF] opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#8A5DD6]/30 to-[#B2F7EF]/30 backdrop-blur-sm"></div>

                  {/* Floating Icons */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Center Brain Icon */}
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Brain className="w-8 h-8 text-[#8A5DD6]" />
                      </div>

                      {/* Orbiting Elements */}
                      <div className="absolute -top-8 -right-8 w-12 h-12 bg-gradient-to-r from-[#A8D8FF] to-[#B2F7EF] rounded-full flex items-center justify-center shadow-md animate-bounce" style={{ animationDelay: '0.5s' }}>
                        <Heart className="w-6 h-6 text-white" />
                      </div>

                      <div className="absolute -bottom-6 -left-6 w-10 h-10 bg-gradient-to-r from-[#8A5DD6] to-[#A8D8FF] rounded-full flex items-center justify-center shadow-md animate-bounce" style={{ animationDelay: '1s' }}>
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>

                      {/* Additional floating elements */}
                      <div className="absolute top-12 -left-12 w-6 h-6 bg-[#B2F7EF] rounded-full animate-pulse opacity-60"></div>
                      <div className="absolute -top-4 left-16 w-4 h-4 bg-[#A8D8FF] rounded-full animate-pulse opacity-70" style={{ animationDelay: '0.3s' }}></div>
                      <div className="absolute bottom-8 right-12 w-8 h-8 bg-[#8A5DD6]/20 rounded-full animate-pulse opacity-50" style={{ animationDelay: '0.8s' }}></div>
                    </div>
                  </div>

                  {/* Animated Rings */}
                  <div className="absolute inset-8 border-2 border-[#8A5DD6]/20 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                  <div className="absolute inset-12 border border-[#A8D8FF]/30 rounded-full animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
                </div>

                {/* Welcome Text */}
                <div className="text-center mt-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Mitra</h3>
                  <p className="text-gray-600">Your AI-powered mental wellness companion</p>
                  <div className="flex justify-center space-x-2 mt-4">
                    <div className="w-2 h-2 bg-[#8A5DD6] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#A8D8FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#B2F7EF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-12">
            <div className="reveal">
              <div className="text-center mb-8">
                <h1 className="font-display font-bold text-4xl lg:text-5xl text-gray-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-xl text-[#8A5DD6] font-semibold mb-1">
                  Mitra
                </p>
                <p className="text-gray-600">
                  Continue your wellness journey
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email/Username Field */}
                <div className="reveal">
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your email or username"
                      className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-[#8A5DD6]/20 focus:border-[#8A5DD6] 
                               transition-all duration-300 backdrop-blur-sm"
                      value={email_or_username}
                      onChange={(e) => setEmail_or_username(e.target.value)}
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
                      placeholder="Enter your password"
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

                {/* Remember Me & Forgot Password */}
                <div className="flex justify-between items-center reveal">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#8A5DD6] border-gray-300 rounded focus:ring-[#8A5DD6] focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link
                    to="/forgot_password"
                    className="text-[#8A5DD6] font-medium hover:text-[#7a3fa9] transition-colors text-sm"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 reveal">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  className="w-full btn-primary py-3 text-base font-semibold reveal group"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign In
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
                  <GoogleButton text="Sign in with Google" />
                </div>

                {/* Register Link */}
                <p className="text-center text-gray-600 reveal">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#8A5DD6] font-semibold hover:text-[#7a3fa9] transition-colors"
                  >
                    Create Account
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

export default Login;