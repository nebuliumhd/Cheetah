import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  }

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

      const response = await fetch('http://localhost:3001/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Try to extract error message from server
        const data = await response.json().catch(() => ({}));
        const message = data.message || 'Registration failed.';
        throw new Error(message);
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="page-background">
      <div className="Register-page">
        <h2 className="Register-Title">Register</h2>
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        {success && <p style={{ color: 'green', fontWeight: 'bold' }}>{success}</p>}

        <form className="register-form" onSubmit={handleSubmit}>
  <label className="form-label">First Name</label>
  <input name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} required />

  <label className="form-label">Last Name</label>
  <input name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} required />

  <label className="form-label">Email</label>
  <input name="email" className="form-input" type="email" value={formData.email} onChange={handleChange} required />

  <label className="form-label">Username</label>
  <input name="userName" className="form-input" value={formData.userName} onChange={handleChange} required />

  <label className="form-label">Password</label>
  <input name="passWord" className="form-input" type="password" value={formData.passWord} onChange={handleChange} required />

  <label className="form-label">Confirm Password</label>
  <input name="confirmPassword" className="form-input" type="password" value={formData.confirmPassword} onChange={handleChange} required />

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