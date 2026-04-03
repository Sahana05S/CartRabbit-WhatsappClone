import { useState } from 'react';
import { LogOut, MessageCircle, Search, Sun, Moon, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/formatTime';
import ChatList from './ChatList';
import CreateGroupModal from './CreateGroupModal';

export default function Sidebar({ selectedUser, onSelectUser }) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);

  return (
    <aside className="w-[320px] min-w-[280px] flex flex-col bg-bg-secondary border-r border-border h-full flex-shrink-0 transition-colors relative">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="avatar w-10 h-10 text-sm flex-shrink-0"
            style={{ backgroundColor: currentUser?.avatarColor || '#7c3aed' }}
          >
            {getInitials(currentUser?.username)}
          </div>
          <div className="min-w-0">
            <p className="text-text-primary font-semibold text-sm truncate leading-tight">
              {currentUser?.username}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
              <span className="text-text-muted text-xs">Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGroupModal(true)}
            title="New Group"
            className="p-2 text-text-muted hover:text-accent-light hover:bg-bg-hover rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-lg transition-all duration-200 flex-shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
    </aside>
  );
}
