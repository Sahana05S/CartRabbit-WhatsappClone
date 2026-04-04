import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const InvitePage = () => {
  const { username } = useParams();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Wait until auth state is determined
    if (authLoading) return;

    const processInvite = async () => {
      // If the user isn't logged in, we just show them the "Sign up to connect" screen
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // If they are logged in, we automatically try to add the inviter
      try {
        setLoading(true);
        // Automatically add contact
        await api.post('/users/add', { identifier: username });
        setSuccess(true);
        // Redirect to chat after 2 seconds
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to add contact.');
      } finally {
        setLoading(false);
      }
    };

    processInvite();
  }, [username, currentUser, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Processing Invite...</h2>
      </div>
    );
  }

  // If user is already logged in but hit an error fetching/adding the inviter
  if (currentUser && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg text-white px-4">
        <div className="bg-bg-secondary p-8 rounded-2xl max-w-md w-full border border-border text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invite Failed</h2>
          <p className="text-text-secondary mb-8">{error}</p>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full bg-accent hover:bg-accent-light text-white py-3 rounded-xl font-bold transition-all"
          >
            Go to My Chats
          </button>
        </div>
      </div>
    );
  }

  // If user is logged in, and successfully added
  if (currentUser && success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg text-white px-4">
        <div className="bg-bg-secondary p-8 rounded-2xl max-w-md w-full border border-accent/30 text-center flex flex-col items-center relative overflow-hidden shadow-2xl shadow-accent/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full blur-2xl" />
          <div className="w-20 h-20 bg-accent/20 text-accent rounded-full flex items-center justify-center mb-6 border border-accent/40 shadow-lg shadow-accent/20">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">You're Connected!</h2>
          <p className="text-text-secondary mb-8 leading-relaxed">
            <span className="text-text-primary font-bold">{username}</span> is now in your contacts.
            <br />
            Taking you to the chat...
          </p>
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  // NOT LOGGED IN: Beautiful landing page prompt
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-dark-bg text-white selection:bg-primary/30">
      {/* Navbar Minimal */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">NexTalk</span>
          </div>
          <Link to="/login" className="text-sm font-semibold hover:text-accent transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative justify-items-center mt-20 px-6 overflow-hidden">
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/30 rounded-full blur-[128px] opacity-50 mix-blend-screen animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-accent/30 rounded-full blur-[100px] opacity-50 mix-blend-screen" style={{ animationDuration: '4s' }} />

        <div className="z-10 bg-bg-secondary p-10 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[100px] blur-2xl" />
          
          <div className="w-24 h-24 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-xl relative">
            <UserPlus className="w-10 h-10 text-white" />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-[3px] border-bg-secondary" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">
            <span className="text-accent">{username}</span> invited you to connect!
          </h2>
          
          <p className="text-text-muted text-lg mb-8 leading-relaxed max-w-md mx-auto">
            Join NexTalk, the secure, end-to-end encrypted messaging platform, to start chatting instantly.
          </p>

          <Link 
            to="/register"
            className="group relative flex items-center justify-center gap-3 w-full bg-white text-black py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-95 overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent w-[200%] translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />
            Get Started
          </Link>
          
          <p className="text-xs text-text-muted mt-6 font-semibold uppercase tracking-widest">
            Secure • Premium • Real-Time
          </p>
        </div>
      </main>
    </div>
  );
};

// Simple success icon component
const Check = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default InvitePage;
