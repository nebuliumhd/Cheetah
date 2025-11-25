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
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const res = await fetch(`${API_BASE}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Data from verify:", data);
          console.log("Profile picture value:", data.profile_picture);
          setUsername(data.username);
          setUserId(data.userId);
          setProfilePicture(data.profile_picture || null);
          sessionStorage.setItem('username', data.username);
          sessionStorage.setItem('userId', data.userId);
          if (data.profile_picture) {
            sessionStorage.setItem('profile_picture', data.profile_picture);
          }
        } else {
          // Token invalid - clear everything
          logout();
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [API_BASE, logout]);

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