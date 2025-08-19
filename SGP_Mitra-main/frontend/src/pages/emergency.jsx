import React, { useEffect, useState } from "react";
import "../emergency.css";

const EmergencyHelp = () => {
  const [locationStatus, setLocationStatus] = useState("loading");
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  // ✅ Safe phone call function
  const callEmergency = (number) => {
    if (!number || number === "No phone") {
      alert("Phone number not available.");
      return;
    }
    window.location.href = `tel:${number}`;
  };

  // ✅ Fetch emergency contacts & coping strategies from Flask
  useEffect(() => {
    fetch("http://localhost:5000/api/v1/emergency-data")
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Emergency Data Response:", data);
        setEmergencyContacts(data?.emergency_contacts || []);
        setStrategies(data?.strategies || []);
      })
      .catch((err) => {
        console.error("❌ Error fetching emergency data:", err);
      });
  }, []);

  // ✅ Fetch user location and nearby doctors
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      console.warn("❌ Geolocation is not supported by this browser.");
      setLocationStatus("error");
      setDoctorsLoading(false);
    }

    function success(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log("📍 Latitude:", latitude, "Longitude:", longitude);

      fetch(
        `http://localhost:5000/api/v1/get_nearby_doctors?lat=${latitude}&lng=${longitude}`
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("✅ Nearby Doctors API Response:", data);
          setNearbyDoctors(data?.doctors || []);
          setLocationStatus("success");
          setDoctorsLoading(false);
        })
        .catch((err) => {
          console.error("❌ Fetch error (doctors):", err);
          setLocationStatus("error");
          setDoctorsLoading(false);
        });
    }

    function error(err) {
      console.warn("❌ Geolocation error:", err);
      setLocationStatus("error");
      setDoctorsLoading(false);
    }
  }, []);

  return (
    <div className="main-outer-container">
      {/* HEADER */}

      {/* MAIN SECTION */}
      <main className="container">
        {/* Crisis Alert */}
        <section className="crisis-alert">
          <h2>If you're in immediate danger, call 911</h2>
          <p>
            If you're having thoughts of self-harm or suicide, please reach out
            for help immediately. You're not alone.
          </p>
          <button className="call-button" onClick={() => callEmergency("911")}>
            📞 Call 911 Now
          </button>
        </section>

        {/* Grid Layout */}
        <section className="grid">
          {/* LEFT SECTION */}
          <div className="left-section">
            {/* Crisis Hotlines */}
            <div className="card">
              <h2>Crisis Hotlines</h2>
              {emergencyContacts.length > 0 ? (
                emergencyContacts.map((contact, index) => (
                  <div className="contact" key={index}>
                    <div>
                      <h3>{contact?.name || "Unknown Contact"}</h3>
                      <span>{contact?.available || "Availability unknown"}</span>
                    </div>
                    <button onClick={() => callEmergency(contact?.number)}>
                      Call
                    </button>
                  </div>
                ))
              ) : (
                <p>📞 No emergency contacts available.</p>
              )}
            </div>

            {/* Location Status */}
            <div className="card">
              <h3>Location Services</h3>
              {locationStatus === "loading" && <p>📍 Getting your location...</p>}
              {locationStatus === "success" && (
                <p>✅ Location detected - showing nearby professionals</p>
              )}
              {locationStatus === "error" && (
                <p>⚠️ Enable location for nearby professionals</p>
              )}
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="right-section">
            <div className="card">
              <h2>Nearby Mental Health Professionals</h2>
              <div id="nearby-doctors">
                {doctorsLoading ? (
                  <p>⏳ Loading nearby professionals...</p>
                ) : nearbyDoctors.length > 0 ? (
                  nearbyDoctors.map((doctor, index) => (
                    <div className="doctor" key={index}>
                      <div>
                        <h3>{doctor?.name || "Unnamed Doctor"}</h3>
                        <p>{doctor?.specialty || "Specialty unavailable"}</p>
                      </div>
                      <div>
                        <span>{doctor?.distance || ""}</span>
                        <span>{doctor?.phone || "No phone"}</span>
                      </div>
                      <button onClick={() => callEmergency(doctor?.phone)}>
                        Call
                      </button>
                    </div>
                  ))
                ) : (
                  <p>⚠️ No nearby professionals found.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Coping Strategies */}
        <section className="card">
          <h2>Immediate Coping Strategies</h2>
          <div className="strategies">
            {strategies.length > 0 ? (
              strategies.map((strategy, index) => (
                <div className="strategy" key={index}>
                  <h3>{strategy?.title || "Untitled Strategy"}</h3>
                  <p>{strategy?.description || "No description available"}</p>
                </div>
              ))
            ) : (
              <p>🧘 No strategies available.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EmergencyHelp;