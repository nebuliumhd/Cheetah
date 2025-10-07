import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom'; 
import "./Login.css";
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate(); 
  const { isLoggedIn,login } = useAuth();
  
  const [formData, setFormData] = useState({
    userName: '',
    passWord: ''
  });

  const [error, setError] = useState('');

  if (isLoggedIn) {
    return <Navigate to="/main" replace />;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:3001/api/users/login', formData);
      console.log("Login success:", res.data);

      login(res.data.user.userName);
      navigate('/main');

    } catch (err) {
      console.error("Login error:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className='Login-Page'>
      <h2 className='Login'>Login</h2>
      {error && <p style={{ color: 'Black' }}>{error}</p>}

      <form className='login-form2' onSubmit={handleSubmit}>
        <input
          name="userName"
          className='input7'
          placeholder="Username"
          value={formData.userName}
          onChange={handleChange}
          required
        />
        <input
          name="passWord"
          className='input8'
          placeholder="Password"
          type="password"
          value={formData.passWord}
          onChange={handleChange}
          required
        />
        <button className='custom-button1' type="submit">Login</button>
      </form>

      <p className='Register-Redirect'>
        Don't have an account? <Link to="/register" className='Register-Link'>Register here</Link>
      </p>
    </div>
  );
};

export default Login;