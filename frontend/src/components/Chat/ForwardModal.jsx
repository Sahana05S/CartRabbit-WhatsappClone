import { useState, useEffect, useRef } from 'react';
import { X, Search, Send, Check, Loader2, Users } from 'lucide-react';
import api from '../../api/axios';
import { getInitials } from '../../utils/formatTime';
import { useSocket } from '../../context/SocketContext';
import { useE2EE } from '../../context/E2EEContext';

export default function ForwardModal({ message, onClose }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [selected,    setSelected]    = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [error,       setError]       = useState('');
  const { onlineUsers } = useSocket();
  const { encryptFor, decryptMsg, isE2EEReady } = useE2EE();
  const inputRef = useRef(null);

  // Load user list on mount
  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data.users || data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));

    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleUser = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleForward = async () => {
    try {
      setSending(true);
      setError('');

      if (message.isE2EE) {
        // Multi-recipient E2EE forward must be handled individually by re-encrypting per peer
        const plaintext = await decryptMsg(message);
        if (plaintext === null) {
          throw new Error('Could not decrypt original message to forward it.');
        }

        const forwardPromises = [...selected].map(async (receiverId) => {
          const envelope = await encryptFor(receiverId, plaintext);
          if (!envelope) throw new Error(`Encryption failed for recipient: ${receiverId}`);
          
          return api.post('/messages', {
            receiverId,
            text: '',
            isE2EE: true,
            e2ee: envelope,
            isForwarded: true
          });
        });

        await Promise.all(forwardPromises);
      } else {
        // Standard forward for plain messages/media
        await api.post(`/messages/${message._id}/forward`, {
          receiverIds: [...selected],
        });
      }

      setSent(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Forward failed. Try again.');
      setSending(false);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const previewText = message.messageType === 'image'  ? '📷 Photo'
                    : message.messageType === 'file'   ? `📎 ${message.attachment?.fileName || 'File'}`
                    : (message.text || '').slice(0, 60) + ((message.text?.length > 60) ? '…' : '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-panel border border-white/10 rounded-2xl shadow-panel w-full max-w-sm flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-text-primary font-semibold text-sm">Forward message</h3>
            <p className="text-text-muted text-[11px] truncate mt-0.5 max-w-[220px]">{previewText}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-bg-secondary border border-white/[0.06] rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto max-h-64 px-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent-light" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-6">No users found</p>
          ) : (
            filtered.map(user => {
              const isSelected = selected.has(user._id);
              const isOnline   = onlineUsers.includes(user._id);
              return (
                <button
                  key={user._id}
                  onClick={() => toggleUser(user._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left mb-0.5
                    ${isSelected ? 'bg-accent/15 border border-accent/30' : 'hover:bg-white/5 border border-transparent'}
                  `}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="avatar w-9 h-9 text-[13px]" style={{ backgroundColor: user.avatarColor || '#7c3aed' }}>
                      {getInitials(user.username)}
                    </div>
                    {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-bg-panel rounded-full" />}
                  </div>

                  {/* Name */}
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    {user.isGroup && <Users className="w-3.5 h-3.5 flex-shrink-0 text-text-muted opacity-80" />}
                    <span className={`text-sm font-medium truncate ${isSelected ? 'text-accent-light' : 'text-text-primary'}`}>
                      {user.username}
                    </span>
                  </div>

                  {/* Checkmark */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                    ${isSelected ? 'bg-accent border-accent' : 'border-white/20'}
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-[12px] text-center px-4 pb-1">{error}</p>}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <span className="text-text-muted text-[12px]">
            {selected.size > 0 ? `${selected.size} selected` : 'Select recipients'}
          </span>
          <button
            onClick={handleForward}
            disabled={!selected.size || sending || sent}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sent ? (
              <><Check className="w-4 h-4" /> Sent!</>
            ) : sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              <><Send className="w-4 h-4" /> Forward</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
