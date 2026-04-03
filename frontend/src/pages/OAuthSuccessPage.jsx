import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const consumeOAuthToken = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('oauth_token');

        if (!token) {
          navigate('/login?error=oauth_failed', { replace: true });
          return;
        }

        // Strip the token from the URL
        window.history.replaceState({}, document.title, '/auth/google/success');

        // Fetch user profile
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.user) {
          login(token, data.user);
          // Small delay for visual effect as per new UI design
          setTimeout(() => {
            navigate('/chat', { replace: true });
          }, 1500);
        } else {
          navigate('/login?error=oauth_failed', { replace: true });
        }
      } catch (err) {
        console.error('OAuth success page error:', err);
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    consumeOAuthToken();
  }, [login, navigate, location]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-dark-bg text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 text-center"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full mx-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4 tracking-tight text-white">NexTalk</h1>
        <div className="flex items-center justify-center gap-3 text-[#aebac1]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-lg">Signing you in securely...</p>
        </div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-1 bg-primary rounded-full mt-8 max-w-[200px] mx-auto overflow-hidden"
        >
          <div className="h-full bg-primary/30 w-full animate-pulse" />
        </motion.div>
      </motion.div>

      <div className="absolute bottom-10 text-[#aebac1] text-sm font-medium">
        Establishing encrypted connection...
      </div>
    </div>
  );
};

export default OAuthSuccessPage;
