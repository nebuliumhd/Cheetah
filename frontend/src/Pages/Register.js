import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "../App.css";
import './Register.css';
import RequimentsList from '../Components/PasswordRequirement/PasswordRequirements.js';
const RegisterUser = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  
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
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.userName,
        email: formData.email,
        password: formData.passWord
      };

      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();  
      // console.log(payload);
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
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
  <label className="form-label" htmlFor="firstName">First Name</label>
  <input id="firstName" name="firstName" className="form-input" maxLength={25} value={formData.firstName} onChange={handleChange} required />

  <label className="form-label" htmlFor="lastName">Last Name</label>
  <input id="lastName" name="lastName" className="form-input" maxLength={25} value={formData.lastName} onChange={handleChange} required />

  <label className="form-label" htmlFor="userName">Username</label>
  <input id="userName" name="userName" className="form-input" maxLength={25} value={formData.userName} onChange={handleChange} required />

  <label className="form-label" htmlFor="email">Email</label>
  <input id="email" name="email" type="email" className="form-input" maxLength={255} value={formData.email} onChange={handleChange} required />

  <label className="form-label" htmlFor="passWord">Password</label>
  <input id="passWord" name="passWord" type="password" className="form-input" value={formData.passWord} onChange={handleChange} required />

  <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
  <input id="confirmPassword" name="confirmPassword" type="password" className="form-input" value={formData.confirmPassword} onChange={handleChange} required />

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