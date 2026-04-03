import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount and fetch fresh data
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('nextalk_token');
        const raw   = localStorage.getItem('nextalk_user');
        
        if (token && raw) {
          const user = JSON.parse(raw);
          setCurrentUser(user);
          
          // Fetch latest profile from server
          const { data } = await api.get('/users/me');
          if (data.success) {
            setCurrentUser(data.user);
            localStorage.setItem('nextalk_user', JSON.stringify(data.user));
          }
        }
      } catch (err) {
        console.error('Auth rehydration failed', err);
        // Don't clear storage on every error (e.g. network error)
        // only if explicitly unauthorized or corrupt
        if (err.response?.status === 401) {
          localStorage.removeItem('nextalk_token');
          localStorage.removeItem('nextalk_user');
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (token, user) => {
    localStorage.setItem('nextalk_token', token);
    localStorage.setItem('nextalk_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('nextalk_token');
    localStorage.removeItem('nextalk_user');
    setCurrentUser(null);
  };

  const updateUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('nextalk_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
