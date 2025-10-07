import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const LandingPage = () => {
  return (
    <div className="MainDiv">
      
      <div className="TextDiv">
        
        <h1 className="Title">Welcome to Giftcord</h1>
        
        <p className="Body">
          Connect with friends, join communities, and explore our store. This site lets you chat,
          send friend requests, find servers, and send gifts to friends all in one place.
        </p>
        
        <Link to="/register">
          <button className="Landing-Button">
            Get Started
          </button>
        </Link>
      
      </div>
    </div>
  );
};

export default LandingPage;