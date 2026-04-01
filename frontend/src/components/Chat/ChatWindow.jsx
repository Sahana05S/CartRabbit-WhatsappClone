import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyChatState from './EmptyChatState';
import { useMessages } from '../../hooks/useMessages';

export default function ChatWindow({ selectedUser }) {
  const { messages, loading, error, addMessage } = useMessages(selectedUser?._id);

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

      <MessageInput 
        receiverId={selectedUser._id} 
        onMessageSent={(newMsg) => addMessage(newMsg)} 
      />
    </main>
  );
}
