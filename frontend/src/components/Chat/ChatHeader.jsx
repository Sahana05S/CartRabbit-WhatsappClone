import { useState, useEffect, useRef } from 'react';
import { getInitials, formatLastSeen } from '../../utils/formatTime';
import { useSocket } from '../../context/SocketContext';
import { MoreVertical, Search, Video, Phone, X, ChevronUp, ChevronDown, Star, Images } from 'lucide-react';

export default function ChatHeader({ user, searchProps, onOpenStarred, isGalleryOpen, onOpenGallery, isTyping }) {
  const { onlineUsers, socket } = useSocket();
  const isOnline = onlineUsers.includes(user._id);
  const [lastSeen, setLastSeen] = useState(user.lastSeen);
  const searchInputRef = useRef(null);

  // Destructure search state passed from parent
  const {
    isOpen, openSearch, closeSearch,
    query, setQuery,
    matchIds, currentIndex,
    goNext, goPrev,
  } = searchProps;

  useEffect(() => {
    setLastSeen(user.lastSeen);
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleUserOffline = ({ userId, lastSeen: newLastSeen }) => {
      if (userId === user._id) setLastSeen(newLastSeen);
    };
    socket.on('userOffline', handleUserOffline);
    return () => socket.off('userOffline', handleUserOffline);
  }, [socket, user._id]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') closeSearch(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeSearch]);

  const hasResults  = matchIds.length > 0;
  const noResults   = query.trim().length > 0 && !hasResults;
  const resultLabel = hasResults
    ? `${currentIndex + 1} of ${matchIds.length}`
    : noResults ? 'No results' : '';

  return (
    <header className="border-b border-border bg-bg-secondary sticky top-0 z-10 transition-colors">
      {/* Main header row */}
      <div className="h-[72px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="avatar w-10 h-10 shadow-sm"
              style={{ backgroundColor: user.avatarColor || 'var(--accent-default)' }}
            >
              {getInitials(user.username)}
            </div>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-bg-panel rounded-full" />
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-text-primary leading-tight">
              {user.username}
            </h2>
            {/* Priority: typing > online > last seen */}
            <p className={`text-xs mt-0.5 transition-all duration-200 ${
              isTyping
                ? 'text-accent-light italic'
                : isOnline
                  ? 'text-accent'
                  : 'text-text-muted'
            }`}>
              {isTyping
                ? 'typing…'
                : isOnline
                  ? 'online'
                  : lastSeen
                    ? `last seen ${formatLastSeen(lastSeen)}`
                    : 'offline'
              }
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          {/* Search toggle */}
          <button
            onClick={isOpen ? closeSearch : openSearch}
            className={`p-2 rounded-full transition-colors ${isOpen ? 'text-accent-light bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
            title="Search messages"
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={onOpenStarred}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
            title="Starred messages"
          >
            <Star className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenGallery}
            className={`p-2 rounded-full transition-colors ${
              isGalleryOpen
                ? 'text-accent-light bg-accent/10'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5'
            }`}
            title="Media, Links, Docs"
          >
            <Images className="w-5 h-5" />
          </button>
          <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search bar — slides in below the header row */}
      {isOpen && (
        <div className="px-4 pb-3 flex items-center gap-2 animate-slide-up">
          {/* Search input */}
          <div className="flex-1 flex items-center gap-2 bg-bg-panel border border-transparent focus-within:border-border rounded-xl px-3 py-2 transition-all">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search messages…"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            {/* Result counter */}
            {query.trim() && (
              <span className={`text-[11px] flex-shrink-0 font-medium ${noResults ? 'text-red-400' : 'text-text-muted'}`}>
                {resultLabel}
              </span>
            )}
            {/* Clear */}
            {query && (
              <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Prev / Next navigation */}
          <button
            onClick={goPrev}
            disabled={!hasResults}
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous match"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            disabled={!hasResults}
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next match"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Close search entirely */}
          <button
            onClick={closeSearch}
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            title="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
