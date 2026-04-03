import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/Landing/LandingNavbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import SecuritySection from '../components/Landing/SecuritySection';
import Footer from '../components/Landing/Footer';

export default function LandingPage() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If authenticated, redirect to /chat immediately
    if (!loading && currentUser) {
      navigate('/chat', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    // Scroll Reveal Animation Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prevent flash of landing page if logged in
  if (currentUser) return null;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent/30 selection:text-white font-sans overflow-x-hidden">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
}
