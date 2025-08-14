import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function usePageTracking(isLoggedIn) {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
useEffect(() => {
  if (!isLoggedIn) return;

  window.pageStartTime = Date.now();

  return () => {
    if (window.isLoggingOut) {
      window.isLoggingOut = false; // reset
      return; // skip logging on logout
    }

    const endTime = Date.now();
    const timeSpent = ((endTime - startTimeRef.current) / 1000).toFixed(2);

    const data = {
      page: location.pathname,
      timeSpent: `${timeSpent} seconds`,
      timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("pageTracking") || "[]");
    existing.push(data);
    localStorage.setItem("pageTracking", JSON.stringify(existing));

    startTimeRef.current = Date.now();
  };
}, [location, isLoggedIn]);

}
