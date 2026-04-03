import React, { useState } from 'react';
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
  Circle
} from 'lucide-react';

const ChatList = ({ onSelectChat, activeChatId, onOpenProfile, onOpenSettings, onOpenNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  // Mock data for UI demonstration - would come from ChatContext
  const chats = [
    { id: 1, name: 'Alice Cooper', lastMsg: 'See you tonight! 🚀', time: '10:24 AM', unread: 2, online: true, pinned: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { id: 2, name: 'Project Alpha', lastMsg: 'John: The PR is ready for review.', time: '9:15 AM', unread: 0, online: false, pinned: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alpha' },
    { id: 3, name: 'Bob Smith', lastMsg: 'Can you send the file?', time: 'Yesterday', unread: 0, online: true, pinned: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    { id: 4, name: 'Marketing Team', lastMsg: 'Sarah: Great job everyone!', time: 'Monday', unread: 5, online: false, pinned: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team' },
  ];

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-dark-sidebar border-r border-glass-border">
      {/* Sidebar Header */}
      <header className="h-[60px] flex items-center justify-between px-4 bg-dark-sidebar/80 backdrop-blur-md z-10">
        <div 
          className="relative cursor-pointer group"
          onClick={onOpenProfile}
        >
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Manus" 
            alt="My Profile" 
            className="w-10 h-10 rounded-full border border-glass-border hover:ring-2 hover:ring-primary/50 transition-all"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-dark-sidebar rounded-full" />
        </div>

        <div className="flex items-center gap-1">
          <button className="btn-ghost" onClick={onOpenNewChat} title="New Chat">
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button className="btn-ghost" title="New Group">
            <Users className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              className={`btn-ghost ${showMenu ? 'bg-glass text-white' : ''}`} 
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 glass-card-heavy rounded-xl py-2 z-30 shadow-2xl"
                  >
                    <button onClick={() => {onOpenSettings(); setShowMenu(false);}} className="w-full text-left px-4 py-2 hover:bg-glass text-sm">Settings</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-glass text-sm">Archived</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-glass text-sm">Starred Messages</button>
                    <div className="border-t border-glass-border my-1" />
                    <button className="w-full text-left px-4 py-2 hover:bg-glass text-sm text-red-400">Logout</button>
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
            className="w-full bg-dark-panel border-none rounded-lg py-2 pl-10 pr-10 text-sm text-[#e9edef] placeholder-[#aebac1] focus:ring-0"
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

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {filteredChats.map((chat) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all relative group ${activeChatId === chat.id ? 'bg-glass-heavy' : ''}`}
          >
            {/* Active Indicator */}
            {activeChatId === chat.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            )}

            <div className="relative flex-shrink-0">
              <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full border border-glass-border" />
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary border-2 border-dark-sidebar rounded-full shadow-lg" />
              )}
            </div>

            <div className="flex-1 min-w-0 border-b border-glass-border/30 pb-3 group-last:border-none">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-[16px] font-medium text-[#e9edef] truncate">{chat.name}</h3>
                <span className={`text-[12px] ${chat.unread > 0 ? 'text-primary font-semibold' : 'text-[#aebac1]'}`}>
                  {chat.time}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-[14px] text-[#aebac1] truncate">
                  {chat.id === 1 && <CheckCheck className="w-4 h-4 text-accent" />}
                  <span className="truncate">{chat.lastMsg}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {chat.pinned && <Pin className="w-3.5 h-3.5 text-[#aebac1] rotate-45" />}
                  {chat.unread > 0 && (
                    <span className="bg-primary text-dark-bg text-[12px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {chat.unread}
                    </span>
                  )}
                  
                  {/* Hover Actions */}
                  <div className="hidden group-hover:flex items-center gap-1 absolute right-4 bg-dark-panel/90 backdrop-blur-sm p-1 rounded-lg shadow-xl border border-glass-border">
                    <button className="p-1 hover:text-primary transition-colors"><Archive className="w-4 h-4" /></button>
                    <button className="p-1 hover:text-primary transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-[#aebac1] p-4 text-center">
            <Search className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No chats found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
