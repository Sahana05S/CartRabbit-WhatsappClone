import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const AddContactModal = ({ onClose, onContactAdded }) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!identifier.trim() || identifier.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      try {
        setIsSearching(true);
        const { data } = await api.get(`/users/search?q=${identifier.trim()}`);
        setSearchResults(data.users || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [identifier]);

  const handleSelectUser = (user) => {
    setIdentifier(user.username);
    setShowDropdown(false);
  };

  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/users/add', { identifier: identifier.trim() });
      setSuccess(true);
      if (onContactAdded) {
        // give it a second so they see the success state
        setTimeout(() => {
          onContactAdded(data.user);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to add contact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-bg-secondary rounded-2xl shadow-2xl border border-border overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              Add Contact
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-muted hover:text-accent-light hover:bg-bg-hover rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2 relative" ref={wrapperRef}>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                Username or Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="e.g., anya or anya@gmail.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setSuccess(false);
                    setError('');
                  }}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  className="w-full bg-bg-panel border border-border focus:border-accent rounded-xl py-3 pl-9 pr-10 text-sm text-text-primary outline-none transition-all"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
                )}
              </div>

              <AnimatePresence>
                {showDropdown && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-1 bg-bg-panel border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleSelectUser(user)}
                        className="flex items-center gap-3 p-3 hover:bg-bg-hover cursor-pointer transition-colors border-b border-border last:border-b-0"
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-white font-bold overflow-hidden"
                          style={{ backgroundColor: user.avatarUrl ? 'transparent' : (user.avatarColor || '#00a884') }}
                        >
                          {user.avatarUrl ? (
                            <img src={resolveAvatar(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-bold text-text-primary truncate">
                            {user.displayName || user.username}
                          </span>
                          <span className="text-[11px] text-text-muted truncate">
                            @{user.username} • {user.email}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 pl-1">
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !identifier.trim() || success}
              className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                success
                  ? 'bg-green-500 text-white'
                  : 'bg-accent text-white hover:bg-accent-dark disabled:opacity-50 shadow-lg shadow-accent/20 hover:shadow-accent/40'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-5 h-5" /> Added Successfully!
                </>
              ) : (
                'Add to Contacts'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddContactModal;
