import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff, Loader2, User, Mail, Lock, Zap, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = window.location.pathname.includes('register') ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // MFA State
  const [mfaState, setMfaState] = useState({
    required: !!searchParams.get('mfa_token'),
    token: searchParams.get('mfa_token') || '',
    code: '',
    isRecovery: false,
  });

  const [error, setError] = useState(
    searchParams.get('error') === 'oauth_failed'
      ? 'Google sign-in failed. Please try again or use email/password.'
      : ''
  );
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { username: form.username, email: form.email, password: form.password };

      const { data } = await api.post(endpoint, payload);
      
      // If backend says MFA is required, pivot to the MFA challenge screen
      if (data.mfaRequired) {
        setMfaState(prev => ({ ...prev, required: true, token: data.mfaToken }));
        return;
      }

      login(data.token, data.user);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaState.code) return;
    
    setError('');
    setLoading(true);

    try {
      const endpoint = mfaState.isRecovery ? '/auth/mfa/recovery-login' : '/auth/mfa/complete-login';
      const payload = mfaState.isRecovery 
        ? { challengeToken: mfaState.token, recoveryCode: mfaState.code }
        : { challengeToken: mfaState.token, totpCode: mfaState.code };

      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate('/chat');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid code. Please try again.';
      setError(msg);
      
      // If the backend actively rejected the token because it expired (the 5 minute window passed)
      if (err.response?.status === 401 && msg.toLowerCase().includes('expired')) {
        setTimeout(() => {
          setMfaState(prev => ({ ...prev, required: false, token: '', code: '' }));
          setError('Session expired. Please sign in again.');
          // Remove query params if we somehow landed here from OAuth
          navigate('/login', { replace: true });
        }, 1500); 
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setForm({ username: '', email: '', password: '' });
    navigate(`/${newMode}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glow orbs */}
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-accent/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent-dark/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">

        {/* Logo section */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="NexTalk Logo" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-xl border-4 border-bg-panel/50" />
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">NexTalk</h1>
          <p className="text-text-muted mt-1.5 text-sm">Real-time messaging, reimagined</p>
        </div>

        {/* Auth card */}
        <div className="bg-bg-panel border border-border rounded-2xl p-8 shadow-xl relative overflow-hidden min-h-[400px] flex flex-col">

          {mfaState.required ? (
            /* ── MFA Challenge Screen ─────────────────────────────────── */
            <div className="animate-slide-left flex flex-col h-full justify-center">
              <div className="text-center w-full mb-6">
                <div className="w-16 h-16 bg-accent/10 text-accent-light rounded-full flex items-center justify-center mx-auto mb-4">
                  {mfaState.isRecovery ? <Key className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                </div>
                <h2 className="text-xl font-bold text-text-primary">
                  {mfaState.isRecovery ? 'Recovery Login' : 'Verify it’s you'}
                </h2>
                <p className="text-sm text-text-muted mt-2">
                  {mfaState.isRecovery 
                    ? 'Enter one of your 8-character recovery codes.' 
                    : 'Enter the 6-digit code from your authenticator app.'}
                </p>
              </div>

              <form onSubmit={handleMfaSubmit} className="space-y-4" noValidate>
                <div className="relative">
                  <input
                    type="text"
                    value={mfaState.code}
                    onChange={(e) => setMfaState(p => ({ ...p, code: e.target.value.replace(/\s/g, '').toUpperCase() }))}
                    placeholder={mfaState.isRecovery ? "XXXXXXXX" : "000000"}
                    maxLength={mfaState.isRecovery ? 8 : 6}
                    required
                    className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-4 text-text-primary placeholder:text-text-muted/50 text-center tracking-[0.5em] font-mono text-xl focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm px-4 py-3 rounded-xl animate-slide-up text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaState.code.length < (mfaState.isRecovery ? 8 : 6)}
                  className="btn-primary w-full py-3.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMfaState(p => ({ ...p, isRecovery: !p.isRecovery, code: '' }));
                    setError('');
                  }}
                  className="text-sm text-text-muted hover:text-accent-light transition-colors font-medium border-b border-transparent hover:border-accent-light/30"
                >
                  {mfaState.isRecovery ? 'Use authenticator app instead' : 'Try another way (Recovery Code)'}
                </button>
              </div>
            </div>
          ) : (
            /* ── Normal Login / Register Screen ───────────────────────── */
            <div className="animate-slide-right flex flex-col h-full">
              {/* Mode tabs */}
              <div className="flex bg-bg-primary opacity-80 rounded-xl p-1 mb-7 gap-1">
                {[['login', 'Sign In'], ['register', 'Sign Up']].map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => switchMode(tab)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      mode === tab
                        ? 'bg-accent text-white shadow-accent'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Username (register only) */}
                {mode === 'register' && (
                  <div className="animate-slide-up">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="johndoe"
                        required
                        minLength={3}
                        className="input-field pl-10"
                        autoComplete="username"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="input-field pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="input-field pl-10 pr-11"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === 'register' && (
                    <p className="text-text-muted text-xs mt-1.5 ml-1">Minimum 6 characters</p>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm px-4 py-3 rounded-xl animate-slide-up">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  id={mode === 'login' ? 'btn-signin' : 'btn-signup'}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              {/* ── Google OAuth ────────────────────────────────────────────── */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-text-muted text-xs font-medium">or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <a
                href={`${BACKEND_URL}/api/auth/google`}
                id="btn-google-signin"
                className="mt-4 flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-border bg-bg-secondary hover:bg-bg-hover text-text-primary font-semibold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
              >
                <GoogleIcon />
                Sign in with Google
              </a>

              {/* Switch mode link */}
              <p className="text-center text-text-muted text-sm mt-auto pt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="text-accent-light font-semibold hover:text-accent transition-colors"
                >
                  {mode === 'login' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-text-muted text-xs mt-6 opacity-50">
          NexTalk © {new Date().getFullYear()} — Built with ❤️
        </p>
      </div>
    </div>
  );
}
