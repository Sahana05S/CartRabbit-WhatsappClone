import { useEffect, useState, useCallback, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ReplyPreview from './ReplyPreview';
import EmptyChatState from './EmptyChatState';
import StarredMessagesPanel from './StarredMessagesPanel';
import MediaGalleryPanel from './MediaGalleryPanel';
import { useMessages } from '../../hooks/useMessages';
import { useSearch } from '../../hooks/useSearch';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function ChatWindow({ selectedUser }) {
  const { messages, loading, error, addMessage, removeMessageLocally, updateMessageStar } = useMessages(selectedUser);
  const { socket } = useSocket();
  const { currentUser } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const messageListRef = useRef(null);

  // Search state — all logic lives in the hook
  const search = useSearch(messages);

  // Clear reply + search + starred + gallery state when chat changes
  useEffect(() => {
    setIsTyping(false);
    setReplyTo(null);
    setIsStarredOpen(false);
    setIsGalleryOpen(false);
    search.closeSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = (data) => {
      const chatId = typeof data === 'string' ? data : data.chatId;
      if (chatId === selectedUser._id) {
        if (typeof data === 'object' && data.isGroup && data.username) {
          setIsTyping(`${data.username} is typing…`);
        } else {
          setIsTyping('typing…');
        }
      }
    };
    
    const handleStopTyping = (data) => {
      const chatId = typeof data === 'string' ? data : data.chatId;
      if (chatId === selectedUser._id) setIsTyping(false);
    };

    socket.on('typing',     handleTyping);
    socket.on('stopTyping', handleStopTyping);
    return () => {
      socket.off('typing',     handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket, selectedUser]);

  // Build normalized reply object
  const handleReply = useCallback((message) => {
    const senderId = message.senderId?._id || message.senderId;
    const isMe     = senderId === currentUser?._id;
    setReplyTo({
      _id:         message._id,
      senderId:    message.senderId,
      senderName:  isMe ? 'You' : (message.senderId?.username || selectedUser?.username || 'Unknown'),
      previewText: message.text || '',
      messageType: message.messageType || 'text',
    });
  }, [currentUser, selectedUser]);

  // Star toggle — update local state immediately
  const handleStarToggle = useCallback((messageId, isStarred) => {
    updateMessageStar(messageId, isStarred, currentUser?._id);
  }, [updateMessageStar, currentUser]);

  if (!selectedUser) {
    return (
      <main className="flex-1 bg-bg-secondary flex flex-col justify-center items-center">
        <EmptyChatState />
      </main>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-bg-primary relative min-w-0">
        <ChatHeader
          user={selectedUser}
          searchProps={search}
          onOpenStarred={() => { setIsStarredOpen(true);  setIsGalleryOpen(false); }}
          isGalleryOpen={isGalleryOpen}
          onOpenGallery={() => { setIsGalleryOpen(v => !v); setIsStarredOpen(false); }}
          isTyping={isTyping}
        />

        {/* Messages area */}
        <div
          key={selectedUser._id}
          className="flex-1 overflow-hidden relative animate-fade-in"
        >
          <MessageList
            ref={messageListRef}
            messages={messages}
            loading={loading}
            error={error}
            selectedUser={selectedUser}
            onReply={handleReply}
            onDeleteForMe={removeMessageLocally}
            onStarToggle={handleStarToggle}
            searchQuery={search.query}
            searchMatchIds={search.matchIds}
            searchActiveId={search.activeId}
          />
        </div>

        {/* Typing indicator */}
        <div className="h-0 relative z-20">
          {isTyping && (
            <div className="absolute bottom-2 left-4 md:left-6 text-[13px] text-text-muted italic flex items-center gap-1.5 bg-bg-panel/90 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-sm animate-fade-in">
              {typeof isTyping === 'string' ? isTyping : `${selectedUser.username} is typing`}
              <span className="flex gap-0.5 pt-1.5">
                <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce"></span>
              </span>
            </div>
          )}
        </div>

        {/* Reply preview bar */}
        <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />

        <MessageInput
          receiverId={selectedUser._id}
          isGroup={selectedUser.isGroup}
          onMessageSent={(newMsg) => addMessage(newMsg)}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </main>

      {/* Starred Messages Panel */}
      {isStarredOpen && (
        <StarredMessagesPanel
          chatId={selectedUser._id}
          onClose={() => setIsStarredOpen(false)}
          onScrollToMessage={(msgId) => {
            messageListRef.current?.scrollToMessage(msgId);
          }}
          onUnstarMessage={(msgId) => handleStarToggle(msgId, false)}
        />
      )}

      {isGalleryOpen && (
        <MediaGalleryPanel
          chatId={selectedUser._id}
          isGroup={selectedUser.isGroup}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
}
