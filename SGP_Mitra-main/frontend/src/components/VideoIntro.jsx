import React, { useEffect, useRef, useState } from "react";

const VideoIntro = ({ onFinish }) => {
  const videoRef = useRef(null);
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setShouldPlay(true);
    } else {
      // Immediately notify parent to continue app
      if (onFinish) onFinish();
    }
  }, [onFinish]);

  useEffect(() => {
    if (shouldPlay) {
      const video = videoRef.current;
      video?.play();
      video.onended = () => {
        sessionStorage.setItem("hasSeenIntro", "true"); // Mark intro as watched
        if (onFinish) onFinish();
      };
    }
  }, [shouldPlay, onFinish]);

  if (!shouldPlay) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        width: "100%",
        height: "100%",
        backgroundColor: "white",
      }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoIntro;
