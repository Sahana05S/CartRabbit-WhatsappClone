import { useState, useEffect, useRef } from 'react';
import { X, Search, Check, Loader2, Users } from 'lucide-react';
import api from '../../api/axios';
import { getInitials } from '../../utils/formatTime';
import { useSocket } from '../../context/SocketContext';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [selected,    setSelected]    = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName,   setGroupName]   = useState('');
  const [error,       setError]       = useState('');
  const { onlineUsers } = useSocket();
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data.users || data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));

    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

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

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    if (selected.size === 0) {
      setError('Please select at least 1 member.');
      return;
    }
    
    try {
      setCreating(true);
      setError('');
      const { data } = await api.post('/groups', {
        name: groupName.trim(),
        members: [...selected],
      });
      onGroupCreated?.(data.group);
      setTimeout(onClose, 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group. Try again.');
      setCreating(false);
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-light" />
            <h3 className="text-text-primary font-semibold text-sm">New Group</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group Name Input */}
        <div className="px-4 pt-4 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group Subject"
            className="w-full bg-bg-secondary border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-light transition-colors"
          />
        </div>

        {/* Search users */}
        <div className="px-4 pt-2 pb-2">
          <div className="flex items-center gap-2 bg-bg-secondary border border-white/[0.06] rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-64 px-2 custom-scrollbar">
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
                  <div className="relative flex-shrink-0">
                    <div className="avatar w-9 h-9 text-[13px]" style={{ backgroundColor: user.avatarColor || '#7c3aed' }}>
                      {getInitials(user.username)}
                    </div>
                    {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-bg-panel rounded-full" />}
                  </div>
                  <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-accent-light' : 'text-text-primary'}`}>
                    {user.username}
                  </span>
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
        {error && <p className="text-red-400 text-[12px] text-center px-4 pb-1 pt-2">{error}</p>}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between gap-3 bg-bg-secondary">
          <span className="text-text-muted text-[12px]">
            {selected.size} member{selected.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selected.size === 0 || creating}
            className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
