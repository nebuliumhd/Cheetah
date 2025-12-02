import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const UpdateAccount = () => {
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    email: user.email || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const API_BASE = process.env.REACT_APP_API_BASE || '';
      const res = await fetch(`${API_BASE}/api/users/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password || undefined, // only send if updating
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update account.');
      }

      setSuccess('Account updated successfully!');

      // If password changed, log out
      if (formData.password) {
        setTimeout(() => {
          logout();
          window.location.href = '/login';
        }, 2000);
      } else {
        // clear password fields
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (err) {
      setError(err.message || 'Error updating account.');
    }
  };

  return (
    <div className="delete-section"> {/* Reusing delete-section styling */}
      <button
        className="custom-button1"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? 'Cancel Update' : 'Update Account'}
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
            <form onSubmit={handleUpdate} className="delete-form">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />

              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />

              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />

              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

              <label>New Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />

              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

              <button type="submit" className="custom-button1 delete-btn">
                Confirm Update
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

export default UpdateAccount;