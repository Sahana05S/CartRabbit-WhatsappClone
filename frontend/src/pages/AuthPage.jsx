import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  RefreshCcw,
  Chrome,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = window.location.pathname.includes('register') ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [isForgot, setIsForgot] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'oauth_failed'
      ? 'Google sign-in failed. Please try again.'
      : null
  );

  // Unified Form state
  const { login, currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate('/chat', { replace: true });
    }
  }, [currentUser, navigate]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    mfaCode: '',
    recoveryCode: ''
  });

  // MFA State
  const [mfaState, setMfaState] = useState({
    required: !!searchParams.get('mfa_token'),
    token: searchParams.get('mfa_token') || '',
    isRecovery: false,
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (mfaState.required) {
        const endpoint = mfaState.isRecovery ? '/auth/mfa/recovery-login' : '/auth/mfa/complete-login';
        const payload = mfaState.isRecovery 
          ? { challengeToken: mfaState.token, recoveryCode: formData.recoveryCode }
          : { challengeToken: mfaState.token, totpCode: formData.mfaCode };

        const { data } = await api.post(endpoint, payload);
        login(data.token, data.user);
        navigate('/chat');
      } else if (isForgot) {
        const { data } = await api.post('/auth/forgot-password', { email: formData.email });
        setSuccessMsg(data.message || 'Password reset link sent! Check your logs.');
      } else {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin
          ? { email: formData.email, password: formData.password }
          : { username: formData.username, email: formData.email, password: formData.password };

        const { data } = await api.post(endpoint, payload);
        
        if (data.mfaRequired) {
          setMfaState({ required: true, token: data.mfaToken, isRecovery: false });
          return;
        }

        login(data.token, data.user);
        navigate('/chat');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "An error occurred";
      setError(msg);
      
      if (err.response?.status === 401 && msg.toLowerCase().includes('expired')) {
        setTimeout(() => {
          setMfaState({ required: false, token: '', isRecovery: false });
          setError('Session expired. Please sign in again.');
          navigate('/login', { replace: true });
        }, 1500); 
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setIsForgot(false);
    setError(null);
    setSuccessMsg(null);
    setFormData({ ...formData, username: '', email: '', password: '' });
    navigate(loginMode ? '/login' : '/register', { replace: true });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-bg relative overflow-hidden p-4">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
          <p className="text-[#aebac1]">Secure. Premium. Real-time.</p>
        </div>

        <div className="glass-card-heavy rounded-3xl p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!mfaState.required ? (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex bg-glass rounded-xl p-1 mb-8">
                  <button 
                    onClick={() => switchMode(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-[#aebac1] hover:text-white'}`}
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => switchMode(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-[#aebac1] hover:text-white'}`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {!isForgot && !isLogin && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aebac1]" />
                      <input 
                        type="text"
                        name="username"
                        placeholder="Username"
                        required
                        className="glass-input w-full pl-11"
                        value={formData.username}
                        onChange={handleInputChange}
                        autoComplete="username"
                      />
                    </div>
                  )}
                  
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aebac1]" />
                    <input 
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      required
                      className="glass-input w-full pl-11"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                    />
                  </div>

                  {!isForgot && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aebac1]" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        required
                        className="glass-input w-full pl-11 pr-11"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aebac1] hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {!isForgot && isLogin && (
                    <div className="flex justify-end mt-[-8px]">
                      <button type="button" onClick={() => setIsForgot(true)} className="text-sm text-accent hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                    >
                      {error}
                    </motion.p>
                  )}

                  {successMsg && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-emerald-400 text-sm bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20"
                    >
                      {successMsg}
                    </motion.p>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (
                      <>
                        {isForgot ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Create Account')}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {isForgot && (
                    <button 
                      type="button" 
                      onClick={() => { setIsForgot(false); setError(null); setSuccessMsg(null); }} 
                      className="text-[#aebac1] hover:text-white mt-2 text-sm w-full"
                    >
                      Back to Login
                    </button>
                  )}
                </form>

                {!isForgot && (
                  <>
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-glass-border"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#1c2a33] px-2 text-[#aebac1]">Or continue with</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 transition-all py-3 rounded-xl text-gray-900 font-medium shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="mfa-form"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center p-4 bg-accent/20 rounded-full mb-6 border border-accent/30">
                  {mfaState.isRecovery ? <Key className="w-8 h-8 text-accent" /> : <ShieldCheck className="w-8 h-8 text-accent" />}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mfaState.isRecovery ? 'Recovery Login' : 'Verify it’s you'}
                </h2>
                <p className="text-[#aebac1] text-sm mb-8">
                  {mfaState.isRecovery 
                    ? "Enter one of your 8-character recovery codes." 
                    : "Enter the 6-digit code from your authenticator app."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text"
                      name={mfaState.isRecovery ? "recoveryCode" : "mfaCode"}
                      placeholder={mfaState.isRecovery ? "XXXXXXXX" : "000000"}
                      maxLength={mfaState.isRecovery ? 8 : 6}
                      required
                      className="glass-input w-full text-center text-2xl tracking-[0.5em] font-mono py-4"
                      value={mfaState.isRecovery ? formData.recoveryCode : formData.mfaCode}
                      onChange={handleInputChange}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 mb-4"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || (mfaState.isRecovery ? formData.recoveryCode.length < 8 : formData.mfaCode.length < 6)}
                    className="btn-primary w-full py-4 text-lg"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin mx-auto" /> : 'Verify & Login'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setMfaState({ ...mfaState, isRecovery: !mfaState.isRecovery });
                      setError(null);
                    }}
                    className="text-accent hover:underline text-sm font-medium block w-full"
                  >
                    {mfaState.isRecovery ? "Use Authenticator App" : "Try another way (Recovery Code)"}
                  </button>

                  <div className="pt-4">
                    <button 
                      type="button"
                      onClick={() => setMfaState({ required: false, token: '', isRecovery: false })}
                      className="text-[#aebac1] hover:text-white text-sm"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
