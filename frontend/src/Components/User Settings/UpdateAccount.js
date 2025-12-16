/** ABSTRACT: UpdateAccount.js
 *
 *  DESCRIPTION:
 *  Provides an animated collapsible form for authenticated users to update
 *  their account information, including personal details and login credentials.
 *  Manages form state, handles validation, communicates securely with the backend
 *  via PATCH requests, and provides responsive success/error feedback. Logs out
 *  the user automatically if the password is changed.
 *
 *  RESPONSIBILITIES:
 *  - Initialize form fields with the current user's account data.
 *  - Toggle the update form visibility with animated transitions.
 *  - Validate password and confirmPassword fields before submission.
 *  - Send updated account information to the backend with authentication.
 *  - Display success and error messages based on API response.
 *  - Automatically log out and redirect the user if the password is updated.
 *
 *  STATE & HOOKS:
 *  - useState: showForm, formData, error, success
 *  - useAuth(): Access userId, user object, and logout function
 *
 *  FUNCTIONS:
 *  - handleChange(e): Updates local form state on input change.
 *  - handleUpdate(e): Validates input, sends PATCH request, handles success/error, logs out if password changed.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const UpdateAccount = () => {
  const { userId ,user, logout } = useAuth();

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
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/users/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userId,
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