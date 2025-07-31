import React from "react";
import PropTypes from "prop-types";

const NearbyDoctors = ({ nearbyDoctors, callEmergency }) => {
  return (
    <div>
      {nearbyDoctors.length > 0 ? (
        nearbyDoctors.map((doctor) => (
          <div className="doctor" key={`${doctor.phone}-${doctor.name}`}>
            <div>
              <h3>{doctor.name}</h3>
              <p>{doctor.specialty}</p>
            </div>
            <div>
              <span>{doctor.distance}</span>
              <span>{doctor.phone}</span>
            </div>
            <button onClick={() => callEmergency(doctor.phone)}>Call</button>
          </div>
        ))
      ) : (
        <p>No nearby doctors found.</p>
      )}
    </div>
  );
};

NearbyDoctors.propTypes = {
  nearbyDoctors: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      specialty: PropTypes.string,
      phone: PropTypes.string.isRequired,
      distance: PropTypes.string
    })
  ),
  callEmergency: PropTypes.func.isRequired
};

export default NearbyDoctors;