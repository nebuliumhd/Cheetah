import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom'; 
import "./Login.css";
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate(); 
  const { isLoggedIn, login } = useAuth();
  
  const [formData, setFormData] = useState({
    userName: '',
    passWord: ''
  });

  const [error, setError] = useState('');
  const [setSuccess] = useState('');

  if (isLoggedIn) {
    return <Navigate to="/profile" replace />;
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

    try {
      const payload = {
        username: formData.userName,
        password: formData.passWord
      };

      const API_BASE = process.env.REACT_APP_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const data = await res.json();

       if (!res.ok) {
      throw new Error(data.message || 'Invalid credentials');
    }


      // TODO: Check for result returns?
      login(data.user);  
      setSuccess('Login successful! Redirecting to your profile!');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
  };

  return (
  <div className="login-background">
    <div className='Login-Page'>
      <h2 className='Login'>Login</h2>
      {error && <p style={{ color: 'black', fontWeight: 'bold' }}>{error}</p>}

      <form className='login-form2' onSubmit={handleSubmit}>
        <label htmlFor="userName" className="form-label">Username</label>
        <input
          id="userName"
          name="userName"
          className='form-input'
          onChange={handleChange}
          required
        />

        <label htmlFor="passWord" className="form-label">Password</label>
        <input
          id="passWord"
          name="passWord"
          className='form-input'
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
  </div>
);
};

export default Login;