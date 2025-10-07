import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Update.css";
import axios from "axios";

const Update = () => {
  const { username, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  const [formData, setFormData] = useState({
    userName: "",
    passWord: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Fetch full user data from backend based on username
    const fetchUserData = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/users/username/${username}`);
        setUserInfo({
          userName: res.data.user.userName,
          firstName: res.data.user.firstName,
          lastName: res.data.user.lastName,
          email: res.data.user.email,
        });
      } catch (err) {
        setError("Failed to load user data.");
      }
    };

    if (username) fetchUserData();
  }, [username]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const updatedUserName = formData.userName;
    if (updatedUserName && updatedUserName !== userInfo.userName) {
    try {
      const res = await axios.get(`http://localhost:3001/api/users/username/${updatedUserName}`);
      if (res.status === 200) {
        setError("Username already taken. Please choose another.");
        return;
      }
    } catch (err) {
    }
  }

  try {
    const res = await axios.patch(`http://localhost:3001/api/users/update`, formData);
    setSuccess(res.data.message || "Account updated successfully.");
    logout();
    navigate("/landing");
  } catch (err) {
    setError(err.response?.data?.message || "Could not update account details.");
    logout();
  }
  };

  return (
    <div className="update-page">
      <h2>Update Account Information (Changing Account Information Will Sign You Out for Security Purposes)</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {/* User Info Display */}
      <div className="user-info">
        <h3>Current Account Info</h3>
        <p><strong>Username:</strong> {userInfo.userName}</p>
        <p><strong>First Name:</strong> {userInfo.firstName}</p>
        <p><strong>Last Name:</strong> {userInfo.lastName}</p>
        <p><strong>Email:</strong> {userInfo.email}</p>
      </div>

      {/* Update Form */}
      <div className="update-form">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="userName"
            className="input-field"
            placeholder="Change Username"
            value={formData.userName}
            onChange={handleChange} 
          />
          <input
            type="password"
            name="passWord"
            className="input-field"
            placeholder="Change Password"
            value={formData.passWord}
            onChange={handleChange}
          />
          <input
            type="text"
            name="firstName"
            className="input-field"
            placeholder="Change First Name"
            value={formData.firstName}
            onChange={handleChange}
          />
          <input
            type="text"
            name="lastName"
            className="input-field"
            placeholder="Change Last Name"
            value={formData.lastName}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            className="input-field"
            placeholder="Change Email Address"
            value={formData.email}
            onChange={handleChange}
          />

          <button type="submit" className="custom-button">
            Confirm Update
          </button>
        </form>
      </div>
    </div>
  );
};

export default Update;