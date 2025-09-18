import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email_or_username, setEmail_or_Username] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://13.211.214.231/api/v1/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_or_username }),
      });

      const data = await response.json();
      if (response.ok) {
        navigate("/login");
        setMessage(data.msg);
        setError("");
      } else {
        setError(data.msg);
        setMessage("");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong. Please try again.");
      setMessage("");
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center"
           style={{ backgroundColor: "#bb88e8", paddingTop: "120px" }}>
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            Forgot Password
          </h2>
          <p className="text-gray-600 text-center mt-2">
            Enter your email/username to reset your password
          </p>

          {/* Email Input */}
          <form onSubmit={handleSubmit}>
            <div className="mt-6">
              <input
                type="email"
                placeholder="example@gmail.com"
                className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 focus:outline-none"
                value={email_or_username}
                onChange={(e) => setEmail_or_Username(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-[#ad75de] text-white font-semibold w-3/5 rounded-lg py-3 mt-4
                           transition-all duration-300 hover:bg-[#7a3fa9] hover:shadow-md
                           active:scale-95 hover:w-full flex justify-center"
              >
                Send Reset Link
              </button>
            </div>
          </form>

          {/* Success or Error Message */}
          {message && <p className="text-green-500 text-center mt-2">{message}</p>}
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          {/* Back to Login */}
          <p className="text-center mt-4 text-gray-600">
            Remembered your password?
            <Link
              to="/login"
              className="text-[#965ec7] font-semibold transition-colors duration-300 hover:text-[#7a3fa9] ml-1"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
