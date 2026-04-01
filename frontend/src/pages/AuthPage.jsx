import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff, Loader2, User, Mail, Lock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

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
      login(data.token, data.user);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setForm({ username: '', email: '', password: '' });
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-bg-primary flex items-center justify-center">
              <Zap className="w-2 h-2 text-white" />
            </span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">NexTalk</h1>
          <p className="text-text-muted mt-1.5 text-sm">Real-time messaging, reimagined</p>
        </div>

        {/* Auth card */}
        <div className="glass rounded-2xl p-8 shadow-panel">

          {/* Mode tabs */}
          <div className="flex bg-bg-primary/60 rounded-xl p-1 mb-7 gap-1">
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

          {/* Switch mode link */}
          <p className="text-center text-text-muted text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-accent-light font-semibold hover:text-accent transition-colors"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-text-muted text-xs mt-6 opacity-50">
          NexTalk © {new Date().getFullYear()} — Built with ❤️
        </p>
      </div>
    </div>
  );
}
