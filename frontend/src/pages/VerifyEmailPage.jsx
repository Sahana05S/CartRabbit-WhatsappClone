import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        // Log the user in automatically with the returned token
        login(data.token, data.user);
        setTimeout(() => navigate('/chat', { replace: true }), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired verification link.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-bg relative overflow-hidden p-4">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl mb-4 border border-primary/30"
          >
            <ShieldCheck className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">NexTalk</h1>
          <p className="text-[#aebac1]">Email Verification</p>
        </div>

        <div className="glass-card-heavy rounded-3xl p-10 flex flex-col items-center gap-5 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-14 h-14 text-primary animate-spin" />
              <p className="text-white text-lg font-semibold">Verifying your email…</p>
              <p className="text-[#aebac1] text-sm">Please wait a moment.</p>
            </>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400" />
              <p className="text-white text-xl font-bold">Email Verified!</p>
              <p className="text-emerald-400 text-sm">{message}</p>
              <p className="text-[#aebac1] text-xs">Redirecting you to the chat…</p>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4"
            >
              <XCircle className="w-16 h-16 text-red-400" />
              <p className="text-white text-xl font-bold">Verification Failed</p>
              <p className="text-red-400 text-sm">{message}</p>
              <button
                onClick={() => navigate('/register', { replace: true })}
                className="mt-2 btn-primary px-6 py-2 text-sm"
              >
                Back to Register
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
