import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Landing.css";

const LandingPage = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="BackgroundDiv">
      <div className="MainDiv">
        <div className="TextDiv">
          <h1 className="Title">Welcome to ChetChat!</h1>

          <p className="Body">
            Connect with friends, join communities, and explore your own feed!
            ChetChat lets you chat, send friend requests, talk to friends, and
            view a public feed all in one place. Join now and become an chetter!
          </p>

          <button className="Landing-Button" onClick={handleGetStarted}>
            Get Started!
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
