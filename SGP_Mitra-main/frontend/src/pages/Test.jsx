import React, { useState } from 'react';
import '../Test.css';
import { useCookies } from "react-cookie";
import { useEffect } from 'react';
import illustration from "../assets/Illustration.jpg.jpeg";
import Navbar from "../components/Navbar"

const optionColors = {
  0: "#2ecc71", 
  1: "#f1c40f", 
  2: "#e67e22", 
  3: "#e74c3c"  
};

const questions = [
  { key: "q0", text: "Little interest or pleasure in doing things" },
  { key: "q1", text: "Feeling down, depressed, or hopeless" },
  { key: "q2", text: "Trouble falling or staying asleep, or sleeping too much" },
  { key: "q3", text: "Feeling tired or having little energy" },
  { key: "q4", text: "Poor appetite or overeating" },
  { key: "q5", text: "Feeling bad about yourself or that you are a failure or have let yourself or your family down" },
  { key: "q6", text: "Trouble concentrating on things, such as reading the newspaper or watching television" },
  { key: "q7", text: "Moving or speaking so slowly that other people could have noticed. Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual" },
  { key: "q8", text: "Thoughts that you would be better off dead, or of hurting yourself" }
];

function Test() {
  const [username, setUsername] = useState("");
  const [cookies] = useCookies(["access_token"]);
  const initialResponses = questions.reduce((acc, cur) => {
    acc[cur.key] = null;
    return acc;
  }, {});

  const [responses, setResponses] = useState(initialResponses);
  const [loading, setLoading] = useState(false); // Loading state added

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        if (!cookies.access_token) {
          console.error("No access token found.");
          return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/v1/get-username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ access_token: cookies.access_token }),
        });

        const data = await response.json();

        if (response.ok) {
          setUsername(data.username);
        } else {
          console.error("Error fetching username:", data.msg);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchUsername();
  }, [cookies.access_token]);

  const handleOptionSelect = (questionKey, value) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const renderQuestionOptions = (questionKey) => {
    return (
      <div className="question-options">
        {[0, 1, 2, 3].map((value, index) => (
          <React.Fragment key={index}>
            <div className="option-wrapper" style={{ '--option-color': optionColors[value] }}>
              <div className="small-circle left"></div>
              <div
                className={`option ${responses[questionKey] === value ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(questionKey, value)}
              >
                <div className="outer-circle"></div>
              </div>
              <div className="small-circle right"></div>
            </div>
            {index < 3 && (
              <div className="connector" style={{ '--option-color': optionColors[value] }}>
                <div className="connector-line"></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFilled = Object.values(responses).every(value => value !== null);

    if (!allFilled) {
      alert("Please fill all the values before submitting.");
      return;
    }

    setLoading(true); // Start loading

    const totalScore = Object.values(responses).reduce(
      (sum, value) => sum + (value !== null ? value : 0),
      0
    );

    console.log("Submitted responses:", responses);
    console.log("Total Score:", totalScore);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/v1/store_test_score",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: cookies.access_token,
            test_score: totalScore,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert(`Questionnaire submitted! Total Score: ${totalScore}`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting score:", error);
      alert("Failed to submit score. Please try again.");
    }

    setLoading(false); // Stop loading after process completes
  };

  return (
    <div className='main'>
      <Navbar/>
    <div className="app">
      <div className="questionnaire-container">
        <div className="questionnaire-header">
          <div className="header-content">
            <h1>Patient Health Questionnaire (PHQ-9)</h1>
            <p>Your Mental Health Today Test</p>
            <div className="header-illustration">
              <img src={illustration} alt="Questionnaire Illustration" className="w-20 h-20" />
            </div>
          </div>
        </div>

        <div className="questionnaire-instructions">
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </div>

        <div className="questions-scroll">
          <form onSubmit={handleSubmit} className="phq-form">
            {questions.map((q, index, arr) => (
              <React.Fragment key={q.key}>
                <div className="question">
                  <label>{q.text}</label>
                  {renderQuestionOptions(q.key)}
                </div>
                {index < arr.length - 1 && <div className="question-divider"></div>}
              </React.Fragment>
            ))}
          </form>
        </div>

        {/* Submit Button with Loading State */}
        <button
          type="submit"
          className="submit-button"
          onClick={handleSubmit}
          disabled={loading} // Disable button while loading
        >
          {loading ? (
            <span className="loader">Loading...</span> // Show loader animation
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
    </div>

  );
}

export default Test;