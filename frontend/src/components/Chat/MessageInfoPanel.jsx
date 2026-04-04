import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  CheckCheck, 
  Clock, 
  Info,
  Calendar,
  User as UserIcon,
  Search,
  Users
} from 'lucide-react';
import api from '../../api/axios';
import { formatFullDate, formatMessageTime } from '../../utils/formatTime';

const MessageInfoPanel = ({ messageId, onClose }) => {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/messages/info/${messageId}`);
        if (data.success) {
          setMessage(data.message);
        }
      } catch (err) {
        console.error('Failed to fetch message info', err);
        setError('Failed to load message details.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [messageId]);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-bg-panel border-l border-border animate-in slide-in-from-right duration-300">
        <header className="h-[60px] flex items-center gap-4 px-4 border-b border-border">
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold">Message Info</h2>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold uppercase tracking-widest">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex flex-col h-full bg-bg-panel border-l border-border animate-in slide-in-from-right duration-300">
        <header className="h-[60px] flex items-center gap-4 px-4 border-b border-border">
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-red-500">Error</h2>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
          <Info className="w-12 h-12 text-red-500/50 mb-4" />
          <p className="text-text-primary font-bold">{error || 'Message not found'}</p>
          <button onClick={onClose} className="btn-primary mt-4">Close Info</button>
        </div>
      </div>
    );
  }

  const isGroup = message.chatType === 'group';

  return (
    <div className="flex flex-col h-full bg-bg-panel border-l border-border shadow-2xl z-[102] overflow-hidden">
      <header className="h-[60px] flex items-center justify-between px-4 border-b border-border bg-bg-secondary/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn-ghost p-1.5 hover:bg-bg-hover rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-text-primary">Message Info</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {/* Message Preview Section */}
        <div className="p-6 bg-gradient-to-b from-bg-secondary/30 to-transparent border-b border-border/50">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-4">Original Message</p>
          <div className={`relative p-4 rounded-2xl max-w-full shadow-sm ${message.isE2EE ? 'bg-bg-panel border border-accent/20' : 'bg-accent/5 border border-accent/10'}`}>
            <p className="text-[15px] font-medium leading-relaxed text-text-primary break-words whitespace-pre-wrap">
              {message.isE2EE ? '🔒 Encrypted Content' : (message.text || 'Attachment')}
            </p>
            <div className="flex justify-end items-center gap-2 mt-2 opacity-50 text-[11px] font-bold">
              <span>{formatMessageTime(message.createdAt)}</span>
              {message.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-accent" /> :
               message.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> :
               <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Status Blocks */}
        <div className="space-y-1">
          {/* Read Section */}
          <div className="mt-4">
            <div className="px-6 py-2 flex items-center gap-2 text-accent">
              <CheckCheck className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Read By</span>
            </div>
            
            <div className="divide-y divide-border/30">
              {isGroup ? (
                message.readBy?.length > 0 ? (
                  message.readBy.map((receipt, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      key={receipt.user?._id || idx} 
                      className="flex items-center gap-4 px-6 py-4 hover:bg-bg-hover transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full border border-border overflow-hidden bg-bg-secondary flex-shrink-0">
                        {receipt.user?.avatarUrl ? (
                          <img src={resolveAvatar(receipt.user.avatarUrl)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: receipt.user?.avatarColor }}>
                            {receipt.user?.username?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{receipt.user?.username || 'Member'}</p>
                        <p className="text-[11px] text-text-muted font-medium mt-0.5">{formatFullDate(receipt.readAt)}</p>
                      </div>
                      <CheckCheck className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))
                ) : (
                  <div className="px-10 py-6 text-center italic text-text-muted text-xs">No one has read this yet.</div>
                )
              ) : (
                message.status === 'read' ? (
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-bg-hover transition-colors">
                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">Recipient</p>
                      <p className="text-[11px] text-text-muted font-medium mt-0.5">{formatFullDate(message.readAt || message.updatedAt)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-10 py-6 text-center italic text-text-muted text-xs">Recipient hasn't read this yet.</div>
                )
              )}
            </div>
          </div>

          {/* Delivered Section (1-on-1 only usually, for groups it's more complex) */}
          {!isGroup && (
            <div className="mt-4">
              <div className="px-6 py-2 flex items-center gap-2 text-text-muted">
                <CheckCheck className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Delivered To</span>
              </div>
              <div className="flex items-center gap-4 px-6 py-4 border-b border-border/30">
                <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted border border-border">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">Recipient</p>
                  <p className="text-[11px] text-text-muted font-medium mt-0.5">{message.status === 'delivered' || message.status === 'read' ? formatFullDate(message.createdAt) : 'Pending...'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Info */}
        <div className="mt-8 px-6 pt-6 border-t border-border/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">Message Details</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center border border-border">
                <Calendar className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-text-muted opacity-60">Sent On</p>
                <p className="text-xs font-bold text-text-primary">{formatFullDate(message.createdAt)}</p>
              </div>
            </div>
            {message.isE2EE && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
                  <Lock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-accent opacity-60">Encryption</p>
                  <p className="text-xs font-bold text-text-primary">AES-GCM-256 (v1)</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center border border-border">
                {isGroup ? <Users className="w-4 h-4 text-text-muted" /> : <UserIcon className="w-4 h-4 text-text-muted" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-text-muted opacity-60">Chat Type</p>
                <p className="text-xs font-bold text-text-primary uppercase tracking-tighter">{message.chatType}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInfoPanel;
