import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const AddContactModal = ({ onClose, onContactAdded }) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                Username or Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="e.g., anya@gmail.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-bg-panel border border-border focus:border-accent rounded-xl py-3 pl-9 pr-4 text-sm text-text-primary outline-none transition-all"
                  autoFocus
                />
              </div>
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
