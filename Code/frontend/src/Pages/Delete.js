import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./Delete.css";
import axios from 'axios';

const ConfirmDelete = () => {
  const { logout, username, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: username || '',
    passWord: ''
  });
  
  const [error, setError] = useState('');

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }


  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.delete('http://localhost:3001/api/users/delete', {
        data: formData
      });

      console.log(res.data.message);
      logout(); 
      navigate('/landing');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="delete-page">
      <h2>Confirm Account Deletion</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="userName"
          className='NAME'
          placeholder="Username"
          value={formData.userName}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="passWord"
          className='PASS'
          placeholder="Password"
          value={formData.passWord}
          onChange={handleChange}
          required
        />
        <button type="submit" className="custom-button1">
          Confirm Delete
        </button>
      </form>
    </div>
  );
};

export default ConfirmDelete;