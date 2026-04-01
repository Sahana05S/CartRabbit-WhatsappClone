import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem('nextalk_token');
      const raw   = localStorage.getItem('nextalk_user');
      if (token && raw) {
        setCurrentUser(JSON.parse(raw));
      }
    } catch {
      localStorage.removeItem('nextalk_token');
      localStorage.removeItem('nextalk_user');
    } finally {
      setLoading(false);
    }
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

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
