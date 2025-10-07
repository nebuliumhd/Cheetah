import { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });

  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem('username') || '';
  });

  const login = (name) => {
    setIsLoggedIn(true);
    setUsername(name);
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', name);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext); 