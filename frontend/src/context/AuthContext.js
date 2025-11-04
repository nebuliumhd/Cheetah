import { createContext, useState, useContext, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state
  
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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
          setUsername(data.username);
          setUserId(data.userId);
          sessionStorage.setItem('username', data.username);
          sessionStorage.setItem('userId', data.userId);
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
  }, []);

  const login = (name, id, token) => {
    setUsername(name);
    setUserId(id);
    sessionStorage.setItem('username', name);
    sessionStorage.setItem('userId', id);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUsername('');
    setUserId('');
    sessionStorage.clear();
    localStorage.clear();
  };

  // Derived values
  const isLoggedIn = Boolean(userId);
  const user = userId ? { id: userId, username } : null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, userId, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);