import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const LandingPage = () => {
  return (
    <div style={{
      backgroundColor: '#4b0430ff',
      backgroundImage: 'url(/images/chat-bg.jpg)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      height: '100vh',
      width: '100%',
    }}>
    <div className="MainDiv">
      <div className="TextDiv">
        
        <h1 className="Title">Welcome to ChetChat!</h1>
        
        <p className="Body">
          Connect with friends, join communities, and explore your own feed! ChetChat lets you chat,
          send friend requests, talk to friends, and view a public feed all in one place. Join now and become a chetter!
        </p>
        
        <Link to="/register">
          <button className="Landing-Button">
            Get Started!
          </button>
        </Link>
      
      </div>
    </div>
    </div>
  );
};

export default LandingPage;