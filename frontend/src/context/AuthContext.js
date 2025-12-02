import { createContext, useContext, useState } from 'react';

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

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);