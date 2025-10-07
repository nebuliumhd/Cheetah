import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Register.css';

const RegisterUser = () => {
  const navigate = useNavigate();
   const { isLoggedIn } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userName: '',
    passWord: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isLoggedIn) {
    return <Navigate to="/main" replace />;
  };


  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.passWord !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        userName: formData.userName,
        passWord: formData.passWord
      };
      await axios.post('http://localhost:3001/api/users/register', payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2s
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      setError(message);
    }
  };
  
  return (
    <div className="page-background">
      <div className="Register-page">
        <h2 className="Register-Title">Register</h2>
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <input name="firstName" className="input1" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
          <input name="lastName" className="input2" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
          <input name="email" className="input3" placeholder="Email" type="email" value={formData.email} onChange={handleChange} required />
          <input name="userName" className="input5" placeholder="Username" value={formData.userName} onChange={handleChange} required />
          <input name="passWord" className="input6" placeholder="Password" type="password" value={formData.passWord} onChange={handleChange} required />
          <input name="confirmPassword" className="input4" placeholder="Confirm Password" type="password" value={formData.confirmPassword} onChange={handleChange} required />
          <button className="custom-button" type="submit">Register</button>
        </form>

        <p className="Login-Redirect">
          Already have an account? <Link to="/login" className="Login-Link">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterUser;