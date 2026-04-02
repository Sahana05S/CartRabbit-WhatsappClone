import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MessageList = forwardRef(function MessageList({
  messages, loading, error, onReply, onDeleteForMe, onStarToggle,
  searchQuery, searchMatchIds, searchActiveId,
}, ref) {
  const { currentUser } = useAuth();
  const bottomRef         = useRef(null);
  const scrollContainerRef = useRef(null);
  const [highlightedId, setHighlightedId] = useState(null);   // for reply-click flash
  const prevActiveIdRef = useRef(null);

  // ── Auto-scroll to bottom on new messages (only when not searching) ──────
  useEffect(() => {
    if (searchActiveId) return;   // don't steal scroll while user is navigating search
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, searchActiveId]);

  // ── Scroll to active search result ────────────────────────────────────────
  useEffect(() => {
    if (!searchActiveId || searchActiveId === prevActiveIdRef.current) return;
    prevActiveIdRef.current = searchActiveId;

    const target = document.getElementById(`msg-${searchActiveId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchActiveId]);

  // ── Reply-click scroll + flash ────────────────────────────────────────────
  const scrollToMessage = useCallback((messageId) => {
    const target = document.getElementById(`msg-${messageId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(messageId);
    setTimeout(() => setHighlightedId(null), 1500);
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToMessage
  }), [scrollToMessage]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
        <span className="text-sm text-text-muted font-medium">Loading messages…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm max-w-sm text-center border border-red-500/20">
          {error}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-text-primary font-medium text-lg">Say hello!</p>
          <p className="text-text-muted text-sm mt-1 max-w-[250px] mx-auto leading-relaxed">
            This is the start of your conversation. Messages are end-to-end simulated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="h-full p-6 overflow-y-auto w-full absolute inset-0 custom-scrollbar">
      <div className="flex flex-col space-y-6 max-w-4xl mx-auto pb-4">
        {messages.map((message) => {
          const isSent      = message.senderId._id === currentUser._id || message.senderId === currentUser._id;
          const isSearchHit = searchMatchIds?.includes(message._id);
          const isActive    = message._id === searchActiveId;

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isSent={isSent}
              isHighlighted={highlightedId === message._id}
              isSearchHit={isSearchHit}
              isSearchActive={isActive}
              searchQuery={searchQuery}
              onReply={onReply}
              onScrollToReply={scrollToMessage}
              onDeleteForMe={onDeleteForMe}
              onStarToggle={onStarToggle}
            />
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
});

export default MessageList;
