import React, { useState } from "react";
import { useCookies } from 'react-cookie';

const VoiceAssistant = () => {
  const [cookies] = useCookies(['access_token']);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");

  const handleVoiceChat = async () => {
    const accessToken = cookies.access_token || null;
    setIsRecording(true);
    try {
      const res = await fetch("http://13.211.214.231/api/v1/voice_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_mic: true,
          access_token: accessToken,
        }),
      });

      const data = await res.json();
      setResponseText(data.reply);
    } catch (error) {
      console.error("Error in voice chat:", error);
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Voice Assistant</h1>

      <button
        onClick={handleVoiceChat}
        className={`p-4 rounded-full text-white shadow-lg transition-all duration-300 ${
          isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isRecording ? "Listening..." : "Start Voice Chat 🎙️"}
      </button>

      {responseText && (
        <div className="mt-6 w-full max-w-xl p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Assistant Reply:</h2>
          <p>{responseText}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
