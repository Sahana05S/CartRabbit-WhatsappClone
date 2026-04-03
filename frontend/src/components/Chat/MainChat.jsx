import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  ArrowLeft,
  Smile,
  Paperclip,
  Send,
  Mic,
  Image as ImageIcon,
  FileText,
  User,
  X,
  Star,
  Trash2,
  Reply,
  Info,
  CheckCheck
} from 'lucide-react';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatTime';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ReplyPreview from './ReplyPreview';
import EmptyChatState from './EmptyChatState';
import StarredMessagesPanel from './StarredMessagesPanel';
import MediaGalleryPanel from './MediaGalleryPanel';
import { useSearch } from '../../hooks/useSearch';

const MainChat = ({ selectedChat, onBack }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const { messages, loading, error, addMessage, removeMessageLocally, updateMessageStar } = useMessages(selectedChat);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showStarred, setShowStarred] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messageListRef = useRef(null);

  const search = useSearch(messages);

  useEffect(() => {
    setIsTyping(false);
    setReplyTo(null);
    setShowGallery(false);
    setShowStarred(false);
    search.closeSearch();
  }, [selectedChat?._id]);

  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handleTyping = (data) => {
      const chatId = typeof data === 'string' ? data : data.chatId;
      if (chatId === selectedChat._id) {
        if (typeof data === 'object' && data.isGroup && data.username) {
          setIsTyping(`${data.username} is typing…`);
        } else {
          setIsTyping('typing…');
        }
      }
    };
    
    const handleStopTyping = (data) => {
      const chatId = typeof data === 'string' ? data : data.chatId;
      if (chatId === selectedChat._id) setIsTyping(false);
    };

    socket.on('typing',     handleTyping);
    socket.on('stopTyping', handleStopTyping);
    return () => {
      socket.off('typing',     handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket, selectedChat]);

  const handleReply = useCallback((message) => {
    setReplyTo({
      _id: message._id,
      senderId: message.senderId,
      senderName: message.senderId?._id === currentUser?._id ? 'You' : (message.senderId?.username || selectedChat?.username || 'Unknown'),
      previewText: message.text || '',
      messageType: message.messageType || 'text',
    });
  }, [currentUser, selectedChat]);

  const handleStarToggle = useCallback((messageId, isStarred) => {
    updateMessageStar(messageId, isStarred, currentUser?._id);
  }, [updateMessageStar, currentUser]);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const wallpaperSetting = currentUser?.settings?.appearance?.chatWallpaper;
  let wallpaperStyle = {
    backgroundImage: 'var(--chat-bg-image)',
    backgroundRepeat: 'repeat',
    backgroundSize: '400px',
    backgroundPosition: 'top left'
  };

  if (wallpaperSetting && wallpaperSetting.type !== 'none' && wallpaperSetting.value) {
    if (wallpaperSetting.type === 'color') {
      wallpaperStyle = { backgroundColor: wallpaperSetting.value, backgroundImage: 'none' };
    } else if (wallpaperSetting.type === 'preset') {
      wallpaperStyle = { 
        backgroundImage: `url(${wallpaperSetting.value})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat'
      };
    } else if (wallpaperSetting.type === 'custom') {
      const resolvedUrl = wallpaperSetting.value.startsWith('http') ? wallpaperSetting.value : `${BACKEND_URL}${wallpaperSetting.value}`;
      wallpaperStyle = { 
        backgroundImage: `url("${resolvedUrl}")`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat'
      };
    }
  }

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary text-center px-4">
        <EmptyChatState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden relative">
      {/* Chat Header */}
      <header className="h-[60px] flex items-center justify-between px-4 bg-bg-secondary/80 backdrop-blur-md z-20 border-b border-border/30">
        <div className="flex items-center gap-3 min-w-0">
          <button className="md:hidden btn-ghost -ml-2" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowGallery(true)}>
            <div className="w-10 h-10 rounded-full border border-glass-border overflow-hidden bg-primary/20 flex items-center justify-center">
              {selectedChat.avatarUrl ? (
                <img src={resolveAvatar(selectedChat.avatarUrl)} alt={selectedChat.username || selectedChat.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">{getInitials(selectedChat.displayName || selectedChat.username || selectedChat.name)}</span>
              )}
            </div>
          </div>

          <div className="min-w-0 cursor-pointer" onClick={() => setShowGallery(true)}>
            <h3 className="text-[16px] font-semibold text-text-primary truncate">{selectedChat.displayName || selectedChat.username || selectedChat.name}</h3>
            <p className="text-[12px] text-text-muted truncate">
              {isTyping || (selectedChat.isGroup ? `${selectedChat.members?.length || 0} members` : (selectedChat.bio || 'Click for contact info'))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className={`btn-ghost ${search.isOpen ? 'bg-primary/20 text-primary' : ''}`} onClick={search.openSearch}>
            <Search className="w-5 h-5" />
          </button>
          <div className="relative">
            <button className="btn-ghost" onClick={() => setShowMenu(!showMenu)}>
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
                    className="absolute right-0 mt-2 w-48 bg-bg-panel border border-border rounded-xl py-2 z-[101] shadow-2xl text-text-primary"
                  >
                    <button onClick={() => {setShowGallery(true); setShowMenu(false);}} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm flex items-center gap-3">
                      <Info className="w-4 h-4" /> Contact Info
                    </button>
                    <button onClick={() => {setShowStarred(true); setShowMenu(false);}} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm flex items-center gap-3">
                      <Star className="w-4 h-4" /> Starred Messages
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm flex items-center gap-3">
                      <Trash2 className="w-4 h-4" /> Clear Chat
                    </button>
                    <div className="border-t border-border my-1" />
                    <button onClick={onBack} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-red-500 flex items-center gap-3">
                      <X className="w-4 h-4" /> Close Chat
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-hidden relative bg-chat-pattern bg-blend-soft-light"
        style={wallpaperStyle}
      >
        <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-[1px] z-[1]" />
        
        <div className="absolute inset-0 z-10">
          <MessageList 
            ref={messageListRef}
            messages={messages}
            loading={loading}
            error={error}
            selectedUser={selectedChat}
            onReply={handleReply}
            onDeleteForMe={removeMessageLocally}
            onStarToggle={handleStarToggle}
            searchQuery={search.query}
            searchMatchIds={search.matchIds}
            searchActiveId={search.activeId}
          />
        </div>

        {/* Search Toolbar */}
        <AnimatePresence>
          {search.isOpen && (
            <motion.div 
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className="absolute top-0 left-0 right-0 h-[60px] bg-bg-secondary border-b border-border z-30 flex items-center px-4 gap-4"
            >
              <button onClick={search.closeSearch} className="btn-ghost">
                <X className="w-5 h-5" />
              </button>
              <input 
                type="text" 
                autoFocus
                placeholder="Search messages..."
                className="flex-1 bg-bg-panel border border-border rounded-lg py-2 px-4 text-sm focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted"
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
              />
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span>{search.matchIds.length > 0 ? (search.activeId ? search.matchIds.indexOf(search.activeId) + 1 : 0) : 0} of {search.matchIds.length}</span>
                <div className="flex gap-1 border-l border-border ml-2 pl-2">
                  <button className="btn-ghost p-1" onClick={search.goPrev}>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button className="btn-ghost p-1 rotate-180" onClick={search.goNext}>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Area */}
      <footer className="relative z-20">
        <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
        <MessageInput 
          receiverId={selectedChat._id}
          isGroup={selectedChat.isGroup}
          onMessageSent={(newMsg) => addMessage(newMsg)}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </footer>

      {/* Overlay Panels */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-40 bg-bg-secondary flex flex-col w-full md:w-[400px] right-0 shadow-2xl border-l border-border"
          >
            <MediaGalleryPanel 
              chatId={selectedChat._id}
              isGroup={selectedChat.isGroup}
              onClose={() => setShowGallery(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStarred && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-40 bg-bg-secondary flex flex-col w-full md:w-[400px] right-0 shadow-2xl border-l border-border"
          >
            <StarredMessagesPanel 
              chatId={selectedChat._id}
              onClose={() => setShowStarred(false)}
              onScrollToMessage={(msgId) => {
                messageListRef.current?.scrollToMessage(msgId);
                setShowStarred(false);
              }}
              onUnstarMessage={(msgId) => handleStarToggle(msgId, false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainChat;
