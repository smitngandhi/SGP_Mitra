import React, { useEffect, useRef, useState } from "react";
import intro from "../assets/newintro.mp4"
import intro2 from "../assets/intro2.mp4"
import mainintro from "../assets/intro_main.mov"

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
      if (video) {
        video
          .play()
          .catch((err) => {
            console.warn("Autoplay failed, waiting for user interaction", err);
            const tryPlay = () => {
              video.play();
              window.removeEventListener("click", tryPlay);
            };
            window.addEventListener("click", tryPlay);
          });
  
        video.onended = () => {
          sessionStorage.setItem("hasSeenIntro", "true"); // Mark intro as watched
          if (onFinish) onFinish();
        };
      }
    }
  }, [shouldPlay, onFinish]);
  

  if (!shouldPlay) return null;

   return (
    <div className="flex items-center justify-center bg-transparent overflow-hidden h-screen">
      <video
        ref={videoRef}
        src={mainintro}
        autoPlay
        playsInline
        controls={false}
      >
        Your browser does not support the video tag.
      </video>
    
    </div>
  );
};

export default VideoIntro;
 