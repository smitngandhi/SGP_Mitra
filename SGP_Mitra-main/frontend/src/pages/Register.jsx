import React, { useState } from "react";
import { Link } from "react-router-dom";
import GoogleButton from "../components/GoogleButton";
import illustration from "../assets/Illustration.jpg.jpeg";
import { useNavigate } from "react-router-dom"; 
import Navbar from "../components/Navbar";

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <>
    <Navbar/>
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl w-full flex">
        {/* Left Section - Illustration */}
        <div className="hidden md:flex w-1/2 items-center justify-center bg-white">
          <img 
            src={illustration} 
            alt="Login Illustration" 
            className="w-3/4 transition-transform duration-500 hover:scale-105"
          />
        </div>
        
        {/* Right Section - Registration Form */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-3xl font-medium text-gray-600">
            New here, <span className="text-4xl font-bold text-[#8A7FDB]">Mitra</span>?
          </h2>
          <h2 className="text-lg font-bold text-[#8A7FDB]">Let's begin.</h2>

          {/* Full Name */}
          <div className="mt-6">
            <label className="block text-gray-700 font-medium">Full Name</label>
            <div className="flex items-center border rounded-lg mt-1 px-3 py-2 bg-gray-100">
              <input 
                type="text" 
                placeholder="Enter your name here" 
                className="w-full bg-transparent focus:outline-none text-gray-800" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>
          </div>

          {/* Username */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium">Username</label>
            <div className="flex items-center border rounded-lg mt-1 px-3 py-2 bg-gray-100">
              <input 
                type="text" 
                placeholder="Enter your username here" 
                className="w-full bg-transparent focus:outline-none text-gray-800"
                value={username}
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
          </div>

          {/* Email */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium">Email</label>
            <div className="flex items-center border rounded-lg mt-1 px-3 py-2 bg-gray-100">
              <input 
                type="email" 
                placeholder="Enter valid email here" 
                className="w-full bg-transparent focus:outline-none text-gray-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          {/* Password */}
          <div className="mt-4">
            <label className="block text-gray-700 font-medium">Password</label>
            <div className="flex items-center border rounded-lg mt-1 px-3 py-2 bg-gray-100 relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="w-full bg-transparent focus:outline-none text-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="absolute right-3 cursor-pointer text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          {/* Register Button */}
          <button 
            className="w-full bg-[#8A7FDB] text-white font-semibold rounded-lg py-3 mt-4
                      transition-all duration-300 hover:bg-[#6f63cc] hover:shadow-md"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {/* OR Divider */}
          <div className="flex items-center my-4">
            <hr className="w-full border-gray-300" />
            <span className="px-3 text-gray-400">OR</span>
            <hr className="w-full border-gray-300" />
          </div>

          {/* Google Registration Button */}
          <GoogleButton text="Sign up with Google" />

          {/* Login Link */}
          <p className="text-center mt-4 text-gray-600">
            Already have an account?
            <Link 
              to="/login" 
              className="text-[#8A7FDB] font-semibold transition-colors duration-300 hover:text-[#6f63cc] ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;