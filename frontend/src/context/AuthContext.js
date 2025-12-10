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