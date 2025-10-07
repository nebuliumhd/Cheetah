import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./Main.css";

const Main = () => {
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="Main-Page">
      <h1 className="Contact-Title">Welcome to your Giftcord Account, {username}!</h1>
      <p>
        Still under development, but you can check out the other pages like Contact, Register, and Login.
        Aabaan Samad is the developer of this project.
      </p>

      <button className="custom-button1" onClick={handleLogout}>
        Log Out
      </button>

      <button className="custom-button1" onClick={() => navigate('/delete')}>
        Delete Account
      </button>

      <button className="custom-button1" onClick={() => navigate('/update')}>
        Update Account Information
      </button>
    </div>
  );
};

export default Main;    