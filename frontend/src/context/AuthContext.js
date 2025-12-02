import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // Memoize logout to avoid dependency issues
  const logout = useCallback(() => {
    setUsername('');
    setUserId('');
    setProfilePicture(null);
    sessionStorage.clear();
    localStorage.clear();
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const loadAuthFromStorage = () => {
      const token = localStorage.getItem('token');
      const storedUsername = sessionStorage.getItem('username');
      const storedUserId = sessionStorage.getItem('userId');
      const storedProfilePic = sessionStorage.getItem('profile_picture');
      
      if (token && storedUsername && storedUserId) {
        // Restore from session storage
        setUsername(storedUsername);
        setUserId(storedUserId);
        setProfilePicture(storedProfilePic || null);
      }
      
      setLoading(false);
    };

    loadAuthFromStorage();
  }, []);

  const login = (name, id, token, profilePic = null) => {
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

  // Derived values
  const isLoggedIn = Boolean(userId);
  const user = userId ? { 
    id: userId, 
    username,
    profile_picture: profilePicture 
  } : null;

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      username, 
      userId, 
      user, 
      login, 
      logout, 
      loading,
      updateProfilePicture 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);