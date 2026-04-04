import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, RefreshCcw, ArrowRight, EyeOff, Eye } from 'lucide-react';
import api from '../api/axios';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: formData.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-bg relative overflow-hidden p-4">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <motion.div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl mb-4 border border-primary/30">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Reset Password</h1>
          <p className="text-[#aebac1]">Create a new secure password</p>
        </div>

        <div className="glass-card-heavy rounded-3xl p-8 relative overflow-hidden">
          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <p className="text-emerald-400 mb-6 font-medium">Password successfully reset!</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">
                Return to Login
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aebac1]" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="New Password"
                  required
                  className="glass-input w-full pl-11 pr-11"
                  value={formData.password}
                  onChange={handleInputChange}
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aebac1] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aebac1]" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  required
                  className="glass-input w-full pl-11 pr-11"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  minLength="6"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>
              )}

              <button disabled={loading} type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (
                  <>Reset Password <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
