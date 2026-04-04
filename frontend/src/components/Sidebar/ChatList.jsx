import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquarePlus, 
  Users, 
  MoreVertical, 
  Search, 
  Filter, 
  Pin, 
  Archive,
  CheckCheck,
  Circle,
  LogOut,
  Settings as SettingsIcon,
  Star,
  Loader2,
  ArrowLeft,
  CircleDashed
} from 'lucide-react';
import { useUsers } from '../../hooks/useUsers';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatTime';

const ChatList = ({ 
  users = [], 
  loading = false,
  activeChatId, 
  onSelectChat, 
  togglePinChat,
  toggleArchiveChat,
  onOpenProfile, 
  onOpenSettings, 
  onOpenNewChat,
  onOpenStarred,
  onOpenStatus
}) => {
  const { currentUser, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, groups, unread

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const filteredChats = users.filter(chat => {
    const searchLow = searchQuery.toLowerCase();
    const nameMatch = (chat.displayName || chat.username || chat.name || '').toLowerCase().includes(searchLow);
    
    if (activeTab === 'groups') return nameMatch && chat.isGroup;
    if (activeTab === 'unread') return nameMatch && chat.unreadCount > 0;
    return nameMatch;
  });

  const pinned = filteredChats.filter(u => u.isPinned && !u.isArchived);
  const normal = filteredChats.filter(u => !u.isPinned && !u.isArchived);
  const archived = filteredChats.filter(u => u.isArchived);

  const displayList = showArchived ? archived : [...pinned, ...normal];

  if (loading && users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-secondary">
        <Loader2 className="w-8 h-8 text-accent animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-r border-border">
      {/* Sidebar Header */}
      <header className="h-[60px] flex items-center justify-between px-4 bg-bg-secondary/80 backdrop-blur-md z-10 border-b border-border/30">
        <div 
          className="relative cursor-pointer group"
          onClick={onOpenProfile}
        >
          <div className="w-10 h-10 rounded-full border border-glass-border overflow-hidden bg-primary/20 flex items-center justify-center hover:ring-2 hover:ring-primary/50 transition-all">
            {currentUser?.avatarUrl ? (
              <img 
                src={resolveAvatar(currentUser.avatarUrl)} 
                alt="My Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary">{getInitials(currentUser?.username)}</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent border-2 border-bg-secondary rounded-full" />
        </div>

        <div className="flex items-center gap-1">
          <button className="btn-ghost" onClick={onOpenStatus} title="Status Updates">
            <CircleDashed className="w-5 h-5" />
          </button>
          <button className="btn-ghost" onClick={onOpenNewChat} title="New Chat">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button className="btn-ghost" title="New Group" onClick={onOpenNewChat}>
            <Users className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              className={`btn-ghost ${showMenu ? 'bg-bg-hover text-text-primary' : ''}`} 
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-bg-panel rounded-xl py-2 z-[101] shadow-2xl border border-border text-text-primary"
                  >
                    <button onClick={() => {onOpenSettings(); setShowMenu(false);}} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm flex items-center gap-3">
                      <SettingsIcon className="w-4 h-4" /> Settings
                    </button>
                    <button 
                      onClick={() => {setShowArchived(!showArchived); setShowMenu(false);}} 
                      className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm flex items-center gap-3"
                    >
                      <Archive className="w-4 h-4" /> {showArchived ? 'All Chats' : 'Archived'}
                    </button>
                    <button onClick={() => {onOpenStarred?.(); setShowMenu(false);}} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm flex items-center gap-3">
                      <Star className="w-4 h-4" /> Starred Messages
                    </button>
                    <div className="border-t border-border my-1" />
                    <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-red-500 flex items-center gap-3">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-3 py-2">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className={`w-4 h-4 transition-colors ${searchQuery ? 'text-primary' : 'text-[#aebac1]'}`} />
          </div>
          <input 
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-bg-panel border border-border rounded-lg py-2 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-10 flex items-center px-2 text-[#aebac1] hover:text-white"
            >
              <Circle className="w-2 h-2 fill-current" />
            </button>
          )}
          <button className="absolute inset-y-0 right-3 flex items-center text-[#aebac1] hover:text-primary">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {!showArchived && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'groups', label: 'Groups' },
            { id: 'unread', label: 'Unread' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${
                activeTab === tab.id 
                  ? 'bg-accent/10 border-accent text-accent' 
                  : 'bg-bg-panel border-border text-text-muted hover:bg-bg-hover'
              }`}
            >
              {tab.label}
              {tab.id === 'unread' && users.some(u => u.unreadCount > 0) && (
                <span className="ml-2 w-2 h-2 bg-accent rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {showArchived && (
          <button 
            onClick={() => setShowArchived(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-glass/5 border-b border-glass-border/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Archived Chats ({archived.length})</span>
          </button>
        )}

        {displayList.map((chat) => (
          <motion.div
            key={chat._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all relative group ${activeChatId === chat._id ? 'bg-glass-heavy' : ''}`}
          >
            {activeChatId === chat._id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}

            <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full border border-glass-border overflow-hidden bg-accent/10 flex items-center justify-center">
              {chat.avatarUrl ? (
                <img src={resolveAvatar(chat.avatarUrl)} alt={chat.username || chat.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-accent">{getInitials(chat.displayName || chat.username || chat.name)}</span>
              )}
            </div>
            {onlineUsers.includes(chat._id) && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent border-2 border-bg-panel rounded-full shadow-lg" />
            )}
          </div>

          <div className="flex-1 min-w-0 border-b border-glass-border/30 pb-3 group-last:border-none">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-[16px] font-medium text-text-primary truncate flex items-center gap-2">
                {chat.isGroup && <Users className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                {chat.displayName || chat.username || chat.name}
              </h3>
                <span className={`text-[12px] ${chat.unreadCount > 0 ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                  {chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-[14px] text-text-muted truncate">
                  {chat.lastMessage?.status === 'read' && <CheckCheck className="w-4 h-4 text-accent" />}
                  <span className="truncate">{chat.lastMessage?.text || (chat.isGroup ? 'Group created' : 'Start chatting')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {chat.isPinned && <Pin className="w-3.5 h-3.5 text-[#aebac1] rotate-45" />}
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary text-dark-bg text-[12px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {chat.unreadCount}
                    </span>
                  )}
                  
                  {/* Hover Actions */}
                  <div className="hidden group-hover:flex items-center gap-1 absolute right-4 bg-bg-panel backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-border/80 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleArchiveChat(chat._id); }}
                      className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-accent rounded-lg transition-all"
                      title={chat.isArchived ? "Unarchive" : "Archive"}
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePinChat(chat._id); }}
                      className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-accent rounded-lg transition-all"
                      title={chat.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredChats.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-[#aebac1] p-4 text-center">
            <Search className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No chats found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
