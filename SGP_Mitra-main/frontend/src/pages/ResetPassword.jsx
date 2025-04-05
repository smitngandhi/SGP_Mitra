import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setMessage("");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/v1/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.msg);
        setError("");
        setTimeout(() => navigate("/login"), 3000);
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
          <h2 className="text-2xl font-semibold text-gray-800 text-center">Reset Password</h2>
          <p className="text-gray-600 text-center mt-2">Enter your new password below</p>

          {/* Password Inputs */}
          <form onSubmit={handleSubmit}>
            <div className="mt-6">
              <label className="block text-gray-700 font-medium">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-700 font-medium">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#8A7FDB] text-white font-semibold rounded-lg py-3 mt-4"
            >
              Reset Password
            </button>
          </form>

          {/* Success or Error Message */}
          {message && <p className="text-green-500 text-center mt-2">{message}</p>}
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          {/* Back to Login */}
          <p className="text-center mt-4 text-gray-600">
            Remembered your password?
            <Link 
                                      to="/login" 
                                      className="text-[#8A7FDB] font-semibold 
                                                 transition-colors duration-300 hover:text-[#6f63cc] ml-1"
                                    >
                                      Log In
                                    </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResetPassword;
