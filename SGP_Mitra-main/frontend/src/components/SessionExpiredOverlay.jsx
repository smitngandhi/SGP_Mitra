// SessionExpiredOverlay.js
import React, { useEffect } from "react";
import gif from "../assets/giphy.gif"; // your lofi gif

const SessionExpiredOverlay = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish(); // callback to continue flow (show LogoutVideo)
    }, 6000); // show gif for 6 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <img src={gif} alt="Session Expired" className="w-96 rounded-lg shadow-xl" />
    </div>
  );
};

export default SessionExpiredOverlay;
