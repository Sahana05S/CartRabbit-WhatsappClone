import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import { registerServiceWorker } from './utils/notifications';
import LandingPage from './pages/LandingPage';
import OAuthSuccessPage from './pages/OAuthSuccessPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg text-white">
        <div className="flex flex-col items-center gap-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin z-10" />
          <div className="flex flex-col items-center gap-2 z-10">
            <h2 className="text-xl font-bold tracking-tight">NexTalk</h2>
            <span className="text-dark-panel/80 text-sm animate-pulse">Initializing encrypted session...</span>
          </div>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/" replace />;
};

export default function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="/auth/google/success" element={<OAuthSuccessPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
