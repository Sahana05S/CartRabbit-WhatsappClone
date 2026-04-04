import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

const MessageList = forwardRef(function MessageList({
  messages, loading, error, onReply, onDeleteForMe, onStarToggle,
  searchQuery, searchMatchIds, searchActiveId,
}, ref) {
  const { currentUser } = useAuth();
  const bottomRef         = useRef(null);
  const scrollContainerRef = useRef(null);
  const [highlightedId, setHighlightedId] = useState(null);   // for reply-click flash
  const prevActiveIdRef = useRef(null);

  // ID of the last outgoing message that has been read — the only one to show "Seen at"
  const lastReadMsgId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const sid = m.senderId?._id || m.senderId;
      if (sid === currentUser._id && m.status === 'read') return m._id;
    }
    return null;
  })();

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
    return <LoadingState type="message-list" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Say hello!"
        description="This is the start of your conversation."
      />
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-full py-3 overflow-y-auto w-full absolute inset-0 custom-scrollbar"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="flex flex-col gap-y-[1px] pb-6">
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
              isLastRead={message._id === lastReadMsgId}
              searchQuery={searchQuery}
              onReply={onReply}
              onScrollToReply={scrollToMessage}
              onDeleteForMe={onDeleteForMe}
              onStarToggle={onStarToggle}
            />
          );
        })}
        <div ref={bottomRef} className="h-8" />
      </div>
    </div>
  );
});

export default MessageList;
