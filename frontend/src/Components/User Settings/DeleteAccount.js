import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DeleteAccount = () => {
  const { logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  //get json web token from local storage
  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/users/delete`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete account.');
      }

      setSuccess('Account deleted successfully.');
      setTimeout(() => {
        logout();
        window.location.href = '/register';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error deleting account.');
    }
  };

  return (
    <div className="delete-section">
      <button
        className="custom-button1"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel Delete' : 'Delete Account'}
      </button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="delete-form-container"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <form onSubmit={handleDelete} className="delete-form">
              <p>Please confirm your username and password to delete your account.</p>

              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />

              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <button type="submit" className="custom-button1 delete-btn">
                Confirm Delete
              </button>

              {error && <p style={{ color: 'red' }}>{error}</p>}
              {success && <p style={{ color: 'green' }}>{success}</p>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeleteAccount;