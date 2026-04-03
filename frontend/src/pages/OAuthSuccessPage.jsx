import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

/**
 * This page is the redirect target after Google OAuth succeeds.
 * The backend sets a short-lived "oauth_token" cookie, which we read here,
 * call /api/auth/me to get the user object, store everything in AuthContext,
 * then navigate to /chat — exactly the same post-login flow as email/password.
 */
export default function OAuthSuccessPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const consumeOAuthToken = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('oauth_token');

        if (!token) {
          navigate('/login?error=oauth_failed', { replace: true });
          return;
        }

        // Strip the token from the URL in the browser history to avoid accidental leakage on reload
        window.history.replaceState({}, document.title, '/auth/google/success');

        // Fetch user profile using the token
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.user) {
          // Use the same AuthContext login — identical to email/password login
          login(token, data.user);
          navigate('/chat', { replace: true });
        } else {
          navigate('/login?error=oauth_failed', { replace: true });
        }
      } catch (err) {
        console.error('OAuth success page error:', err);
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    consumeOAuthToken();
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-text-muted animate-pulse">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Signing you in with Google…</p>
      </div>
    </div>
  );
}
