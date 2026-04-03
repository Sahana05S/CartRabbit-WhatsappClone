import { useState } from 'react';
import { LogOut, MessageCircle, Search, Sun, Moon, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/formatTime';
import ChatList from './ChatList';
import CreateGroupModal from './CreateGroupModal';
import ProfilePanel from './ProfilePanel';
import SettingsPanel from './SettingsPanel';
import { Settings } from 'lucide-react';

export default function Sidebar({ selectedUser, onSelectUser }) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  return (
    <aside className="w-[320px] min-w-[280px] flex flex-col bg-bg-secondary border-r border-border h-full flex-shrink-0 transition-colors relative">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0">
        <button 
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 min-w-0 hover:bg-bg-hover rounded-xl p-1 -ml-1 transition-all duration-200 group text-left flex-1 mr-2"
        >
          {/* Avatar */}
          <div
            className="avatar w-10 h-10 text-sm flex-shrink-0 ring-1 ring-border group-hover:ring-accent/40 overflow-hidden"
            style={{ backgroundColor: currentUser?.avatarColor || '#7c3aed' }}
          >
            {currentUser?.avatarUrl ? (
              <img src={resolveAvatar(currentUser.avatarUrl)} alt="Me" className="w-full h-full object-cover" />
            ) : (
              getInitials(currentUser?.username)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-text-primary font-semibold text-sm truncate leading-tight group-hover:text-accent-light transition-colors">
              {currentUser?.displayName || currentUser?.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
              <span className="text-text-muted text-[11px]">Online</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowGroupModal(true)}
            title="New Group"
            className="p-2 text-text-muted hover:text-accent-light hover:bg-bg-hover rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="p-2 text-text-muted hover:text-accent-light hover:bg-bg-hover rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section label + Search */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-3.5 h-3.5 text-accent-light" />
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
            Messages
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            id="search-users"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full bg-bg-panel border border-transparent rounded-xl pl-9 pr-4 py-2.5
                       text-text-primary placeholder:text-text-muted text-sm
                       focus:border-border transition-all"
          />
        </div>
      </div>

      {/* Scrollable user list */}
      <div className="flex-1 overflow-y-auto">
        <ChatList
          search={search}
          selectedUser={selectedUser}
          onSelectUser={onSelectUser}
          // trigger a reload when group created
          key={showGroupModal ? 'paused' : 'active'}
        />
      </div>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(group) => {
            setShowGroupModal(false);
            onSelectUser(group); // Open the new group right away
          }}
        />
      )}

      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </aside>
  );
}
