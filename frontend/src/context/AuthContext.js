/** ABSTRACT: AuthContext.js
 *  
 *  DESCRIPTION:
 *  Provides a React context for managing authentication state across the application.
 *  Handles token validation, login/logout behavior, and persistence of user data.
 *  Exposes authentication state and helper functions to all child components.
 * 
 *  RESPONSIBILITIES:
 *  - Store and manage user identity and authentication state.
 *  - Validate stored authentication tokens with the backend.
 *  - Persist and restore authentication data using browser storage.
 *  - Provide login and logout functionality.
 *  - Expose authentication helpers through a custom hook.
 * 
 *  FUNCTIONS:
 *  - AuthProvider(children): Wraps the application and supplies authentication
 *    state and helper functions via context.
 *  - login(name, id, token, profilePic): Stores user credentials and authentication
 *    token after a successful login.
 *  - logout(): Clears authentication state and removes stored tokens.
 *  - validateToken(token): Verifies a JWT with the backend and returns user data
 *    if valid.
 *  - updateProfilePicture(newPath): Updates the stored profile picture path
 *    in state and session storage.
 *  - useAuth(): Custom hook that provides access to authentication context values.
 * 
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *  PROGRAMMER: Aabaan Samad
 * 
 *  END ABSTRACT
 **/

import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const logout = useCallback(() => {
    setUsername('');
    setUserId('');
    setProfilePicture(null);
    sessionStorage.clear();
    localStorage.removeItem('token');
  }, []);

  // Validate token with backend
  const validateToken = useCallback(async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error('Token validation failed with status:', res.status);
        return null;
      }

      const data = await res.json();
      console.log('Token validation successful:', data);
      
      return {
        id: data.userId,
        username: data.username,
        profile_picture: data.profile_picture
      };
    } catch (err) {
      console.error('Token validation error:', err);
      return null;
    }
  }, [API_BASE]);

  // Check authentication status on mount
  useEffect(() => {
    const loadAuthFromStorage = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        setLoading(false);
        return;
      }

      console.log('Token found, validating...');
      
      // Validate token with backend
      const user = await validateToken(token);
      
      if (user) {
        // Token is valid, restore session
        console.log('Setting user state:', user);
        setUsername(user.username);
        setUserId(user.id);
        setProfilePicture(user.profile_picture || null);
        
        // Update session storage
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('userId', user.id);
        if (user.profile_picture) {
          sessionStorage.setItem('profile_picture', user.profile_picture);
        }
      } else {
        // Token is invalid, clear everything
        console.log('Token invalid, clearing auth');
        localStorage.removeItem('token');
        sessionStorage.clear();
      }
      
      setLoading(false);
    };

    loadAuthFromStorage();
  }, [validateToken]);

  const login = (name, id, token, profilePic = null) => {
    console.log('Login called with:', { name, id, profilePic });
    setUsername(name);
    setUserId(id);
    setProfilePicture(profilePic);
    sessionStorage.setItem('username', name);
    sessionStorage.setItem('userId', id);
    if (profilePic) {
      sessionStorage.setItem('profile_picture', profilePic);
    }
    localStorage.setItem('token', token);
  };

  const updateProfilePicture = (newPath) => {
    setProfilePicture(newPath);
    if (newPath) {
      sessionStorage.setItem('profile_picture', newPath);
    } else {
      sessionStorage.removeItem('profile_picture');
    }
  };

  const isLoggedIn = Boolean(userId);
  const user = userId ? { 
    id: userId, 
    username,
    profile_picture: profilePicture 
  } : null;

  console.log('Auth state:', { isLoggedIn, userId, username, loading });

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      username, 
      userId, 
      user, 
      login, 
      logout, 
      loading,
      updateProfilePicture,
      validateToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);