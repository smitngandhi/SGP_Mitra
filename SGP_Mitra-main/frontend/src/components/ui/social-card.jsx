"use client";

import React from "react";
import { Instagram, Twitter, MessageCircle } from "lucide-react";

// Components
const SocialBox = ({ href, icon, className, delay }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    <div className={`box ${className}`} style={{ transitionDelay: delay }}>
      <span className="icon">{icon}</span>
    </div>
  </a>
);

const SocialCard = ({
  title = "Connect With Us",
  socialLinks = [
    { 
      href: "https://www.instagram.com/keensmit/", 
      icon: <Instagram size={24} />, 
      className: "box1" 
    },
    { 
      href: "https://x.com/SmitGan31627717", 
      icon: <Twitter size={24} />, 
      className: "box2", 
      delay: "0.2s" 
    },
    { 
      href: "#", 
      icon: <MessageCircle size={24} />, 
      className: "box3", 
      delay: "0.4s" 
    },
  ],
}) => (
  <div className="social-card">
    <div className="social-background" />
    <div className="social-logo">{title}</div>

    {socialLinks.map((link, index) => (
      <SocialBox
        key={index}
        href={link.href}
        icon={link.icon}
        className={link.className}
        delay={link.delay}
      />
    ))}

    <div className="box box4" style={{ transitionDelay: "0.6s" }} />
  </div>
);

export const SocialCardComponent = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <SocialCard />
    </div>
  );
};

export { SocialCard };
