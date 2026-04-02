import { useEffect, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyChatState from './EmptyChatState';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../context/SocketContext';

export default function ChatWindow({ selectedUser }) {
  const { messages, loading, error, addMessage } = useMessages(selectedUser?._id);
  const { socket } = useSocket();
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsTyping(false);
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTyping = (senderId) => {
      if (senderId === selectedUser._id) setIsTyping(true);
    };

    const handleStopTyping = (senderId) => {
      if (senderId === selectedUser._id) setIsTyping(false);
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket, selectedUser]);

  if (!selectedUser) {
    return (
      <main className="flex-1 bg-bg-secondary flex flex-col justify-center items-center">
        <EmptyChatState />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0b0f19] relative">
      <ChatHeader user={selectedUser} />
      
      {/* Messages area placeholder styling */}
      <div className="flex-1 overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.03) 0%, transparent 50%)' }}>
        <MessageList messages={messages} loading={loading} error={error} selectedUser={selectedUser} />
      </div>

      <div className="h-0 relative z-20">
        {isTyping && (
          <div className="absolute bottom-2 left-4 md:left-6 text-[13px] text-text-muted italic animate-[pulse_1.5s_ease-in-out_infinite] bg-bg-panel/90 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md shadow-sm">
            {selectedUser.username} is typing...
          </div>
        )}
      </div>

      <MessageInput 
        receiverId={selectedUser._id} 
        onMessageSent={(newMsg) => addMessage(newMsg)} 
      />
    </main>
  );
}
