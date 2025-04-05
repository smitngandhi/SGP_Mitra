import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-md w-full p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">Forgot Password</h2>
          <p className="text-gray-600 text-center mt-2">Enter your email/username to reset your password</p>

          {/* Email Input */}
          <form onSubmit={handleSubmit}>
            <div className="mt-6">
              <label className="block text-gray-700 font-medium">Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#8A7FDB] text-white font-semibold rounded-lg py-3 mt-4
                      transition-all duration-300 hover:bg-[#6f63cc] hover:shadow-md
                      active:scale-95"
            >
              Send Reset Link
            </button>
          </form>

          {/* Success or Error Message */}
          {message && <p className="text-green-500 text-center mt-2">{message}</p>}
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          {/* Back to Login */}
          <p className="text-center mt-4 text-gray-600">
            Remembered your password?
            <Link to="/login" className="text-[#8A7FDB] font-semibold transition-colors duration-300 hover:text-[#6f63cc] ml-1"> Log In </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPassword;
