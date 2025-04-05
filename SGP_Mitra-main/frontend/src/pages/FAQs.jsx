import React, { useState } from "react";
import "../FAQs.css";
import Navbar from "../components/Navbar";

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqData = [
    { question: "What is MITRA?", answer: "MITRA is a mental health platform that provides self-care plans, AI-driven chat support, and personality assessments." },
    { question: "How does MindChat work?", answer: "MindChat is an AI chatbot that offers emotional support and sentiment analysis to track your mood." },
    { question: "How can I check my personality?", answer: "Take our 'Know Your Mind' test, which assesses your personality traits and provides insights into your mental well-being." },
    { question: "Are self-care plans personalized?", answer: "Yes! Our self-care plans are tailored based on your responses to ensure they align with your needs." },
    { question: "How do I contact support?", answer: "You can reach out via the 'Contact Us' page for any assistance regarding the app or mental health resources." },
  ];

  return (
    <div className="maindiv">
    <Navbar/>
    <div className="faq-wrapper">

    <div className="faq-container">
      <h1 className="faq-title">Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqData.map((faq, index) => (
          <div key={index} className={`faq-item ${openIndex === index ? "open" : ""}`}>
            <button className="faq-question" onClick={() => toggleFAQ(index)}>
              {faq.question}
              <span className="faq-arrow">{openIndex === index ? "▲" : "▼"}</span>
            </button>
            <div className="faq-answer">{faq.answer}</div>
          </div>
        ))}
      </div>
    </div>
    </div>

    </div>
  );
};

export default FAQs;