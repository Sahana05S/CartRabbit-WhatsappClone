import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
// Note: wipeE2EE is intentionally NOT called on logout.
// The ECDH private key is non-extractable (browser-enforced) and safe to
// persist in IndexedDB across sessions. Wiping it would make all previously
// encrypted messages permanently unreadable. Wipe only on explicit
// "Reset Encryption" user action (device transfer, security incident).
import { wipeE2EE } from '../services/e2ee/keyService';

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

  const logout = async () => {
    // Do NOT wipe E2EE keys here. The private key is non-extractable and
    // persisting it lets the user read their encrypted message history after
    // re-login. Call resetE2EEKeys() only for explicit key-rotation scenarios.
    localStorage.removeItem('nextalk_token');
    localStorage.removeItem('nextalk_user');
    setCurrentUser(null);
  };

  // Explicit key reset — only call this when the user intentionally wants to
  // rotate their identity key (e.g. "Reset Encryption" in settings).
  // WARNING: after this, ALL previously encrypted messages become unreadable.
  const resetE2EEKeys = async () => {
    try { await wipeE2EE(); } catch { /* best-effort */ }
  };

  const updateUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('nextalk_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, resetE2EEKeys, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
