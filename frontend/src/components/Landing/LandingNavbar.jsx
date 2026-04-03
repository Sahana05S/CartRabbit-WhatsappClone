import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Zap, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 px-6 py-4 bg-bg-primary/80 backdrop-blur-xl z-50 border-b border-border transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="NexTalk Logo" className="w-10 h-10 rounded-xl transition-transform group-hover:scale-105 shadow-sm border border-border/50" />
            <span className="text-xl font-bold text-text-primary tracking-tight">NexTalk</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-text-secondary">
            <button onClick={() => scrollTo('features')} className="hover:text-text-primary transition-colors">Features</button>
            <button onClick={() => scrollTo('security')} className="hover:text-text-primary transition-colors">Security</button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors rounded-full"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-[15px] font-bold text-text-primary hover:text-accent transition-colors ml-2">
              Login
            </Link>
            <Link to="/register" className="px-6 py-2.5 text-[15px] font-bold bg-accent hover:bg-accent-light text-white rounded-full transition-all shadow-accent shadow-md hover:-translate-y-0.5 ml-2">
              Get Started
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg bg-bg-secondary"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg bg-bg-secondary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[73px] left-0 right-0 bg-bg-panel/95 backdrop-blur-3xl border-b border-border p-6 flex flex-col gap-6 z-40 animate-slide-up shadow-2xl">
          <div className="flex flex-col gap-5 text-base font-semibold text-text-secondary">
            <button onClick={() => scrollTo('features')} className="text-left hover:text-text-primary transition-colors">Features</button>
            <button onClick={() => scrollTo('security')} className="text-left hover:text-text-primary transition-colors">Security</button>
          </div>
          <div className="flex flex-col gap-3 pt-6 border-t border-border">
            <Link to="/login" className="px-4 py-3.5 text-center font-bold text-text-primary bg-bg-secondary rounded-xl hover:bg-bg-hover transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-4 py-3.5 text-center font-bold bg-accent hover:bg-accent-light text-white rounded-xl shadow-accent shadow-md transition-all">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
