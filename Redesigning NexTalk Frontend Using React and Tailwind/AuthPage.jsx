import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Key, 
  RefreshCcw,
  Chrome
} from 'lucide-react';
// Assuming AuthContext exists as per PRD
// import { AuthContext } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    mfaCode: '',
    recoveryCode: ''
  });

  // These would come from AuthContext in a real scenario
  // const { login, register, verifyMFA, loginWithGoogle } = useContext(AuthContext);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mfaRequired) {
        // Logic: await verifyMFA(useRecoveryCode ? formData.recoveryCode : formData.mfaCode)
        console.log("Verifying MFA...");
      } else if (isLogin) {
        // Logic: const res = await login(formData.email, formData.password)
        // if (res.mfaRequired) setMfaRequired(true)
        console.log("Logging in...");
        // Simulating MFA trigger for demo purposes if needed
        // setMfaRequired(true);
      } else {
        // Logic: await register(formData.username, formData.email, formData.password)
        console.log("Registering...");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Logic: loginWithGoogle()
    window.location.href = '/api/auth/google'; // Example endpoint
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
            {!mfaRequired ? (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex bg-glass rounded-xl p-1 mb-8">
                  <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-[#aebac1] hover:text-white'}`}
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-[#aebac1] hover:text-white'}`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-gap-y-5 flex flex-col gap-4">
                  {!isLogin && (
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
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#aebac1]" />
                    <input 
                      type="password"
                      name="password"
                      placeholder="Password"
                      required
                      className="glass-input w-full pl-11"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : (
                      <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-glass-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1c2a33] px-2 text-[#aebac1]">Or continue with</span>
                  </div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 glass-input hover:bg-glass transition-all py-3"
                >
                  <Chrome className="w-5 h-5 text-white" />
                  <span className="font-medium">Google</span>
                </button>
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
                  <Key className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify it's you</h2>
                <p className="text-[#aebac1] text-sm mb-8">
                  {useRecoveryCode 
                    ? "Enter one of your 8-character recovery codes." 
                    : "Enter the 6-digit code from your authenticator app."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <input 
                      type="text"
                      name={useRecoveryCode ? "recoveryCode" : "mfaCode"}
                      placeholder={useRecoveryCode ? "XXXX-XXXX" : "000 000"}
                      maxLength={useRecoveryCode ? 9 : 6}
                      required
                      className="glass-input w-full text-center text-2xl tracking-[0.5em] font-mono py-4"
                      value={useRecoveryCode ? formData.recoveryCode : formData.mfaCode}
                      onChange={handleInputChange}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-primary w-full py-4 text-lg"
                  >
                    {loading ? <RefreshCcw className="w-5 h-5 animate-spin mx-auto" /> : 'Verify'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setUseRecoveryCode(!useRecoveryCode)}
                    className="text-accent hover:underline text-sm font-medium"
                  >
                    {useRecoveryCode ? "Use Authenticator App" : "Use Recovery Code"}
                  </button>

                  <div className="pt-4">
                    <button 
                      type="button"
                      onClick={() => setMfaRequired(false)}
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
