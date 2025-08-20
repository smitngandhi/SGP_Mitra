// src/hooks/useLogout.js
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

const useLogout = () => {
  const [cookies, , removeCookie] = useCookies(["access_token"]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    window.isLoggingOut = true;

    const endTime = Date.now();
    const startTime = window.pageStartTime || Date.now();
    const timeSpent = ((endTime - startTime) / 1000).toFixed(2);

    const data = {
      page: window.location.pathname,
      timeSpent: `${timeSpent} seconds`,
      timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("pageTracking") || "[]");
    existing.push(data);
    localStorage.setItem("pageTracking", JSON.stringify(existing));

    const accessToken = cookies.access_token || null;
    localStorage.removeItem("pageTracking");

    try {
      const response = await fetch("http://127.0.0.1:5000/api/v1/receive_list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          user_activity: existing,
        }),
      });

      const result = await response.json();
      console.log("Server Response:", result);
    } catch (error) {
      console.error("Error sending list:", error);
    }
    removeCookie("access_token", { path: "/" });
    navigate("/logout-video");
  };

  return handleLogout;
};

export default useLogout;
