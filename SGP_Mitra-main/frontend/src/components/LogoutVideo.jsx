// LogoutVideo.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logout from "../assets/logout.mp4"
const LogoutVideo = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
      window.location.reload();
    }, 6000); // match video length

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-transparent overflow-hidden">
      <video
        autoPlay
        muted
        playsInline
        className="w-full"
      >
        <source src={logout} type="video/mp4" />
      </video>
    </div>
  );
};

export default LogoutVideo;