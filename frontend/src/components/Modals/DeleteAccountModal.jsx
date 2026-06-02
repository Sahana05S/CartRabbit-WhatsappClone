import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const DeleteAccountModal = ({ onClose }) => {
  const { currentUser, logout, resetE2EEKeys } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // local auth needs password, google auth needs "DELETE" string
  const isLocal = (currentUser?.loginMethod || currentUser?.provider) === 'local';
  const [inputValue, setInputValue] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');

    if (isLocal && !inputValue) {
      setError('Please enter your password.');
      return;
    }
    if (!isLocal && inputValue !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }

    try {
      setLoading(true);
      const payload = isLocal ? { password: inputValue } : { confirm: inputValue };
      
      const { data } = await api.delete('/users/delete-account', { data: payload });
      
      if (data.success) {
        setSuccess(true);
        // Wipe E2EE keys since account is deleted
        await resetE2EEKeys();
        
        setTimeout(() => {
          logout();
          onClose();
          window.location.href = '/login';
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete account.');
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
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-bg-secondary rounded-3xl shadow-2xl border border-red-500/20 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Delete Account?</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              This action is permanent and cannot be undone. All your messages, contacts, and personal data will be completely wiped from our servers.
            </p>
          </div>

          <form onSubmit={handleDelete} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider pl-1">
                {isLocal ? 'Enter Password to Confirm' : 'Type "DELETE" to Confirm'}
              </label>
              <input
                type={isLocal ? "password" : "text"}
                placeholder={isLocal ? "Your password" : "DELETE"}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                className="w-full bg-bg-panel border border-border focus:border-red-500 rounded-xl py-3 px-4 text-sm text-text-primary outline-none transition-all"
                autoFocus
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-400 bg-green-400/10 p-3 rounded-lg border border-green-400/20 text-center font-semibold">
                Account deleted successfully. Logging you out...
              </motion.p>
            )}

            <div className="flex items-center gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || success}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-bg-panel border border-border hover:bg-bg-hover text-text-primary transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success || !inputValue || (!isLocal && inputValue !== 'DELETE')}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteAccountModal;
