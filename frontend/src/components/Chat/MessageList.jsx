import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MessageList({ messages, loading, error }) {
  const { currentUser } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
        <span className="text-sm text-text-muted font-medium">Loading messages...</span>
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
    <div className="h-full p-6 overflow-y-auto w-full absolute inset-0 custom-scrollbar">
      <div className="flex flex-col space-y-6 max-w-4xl mx-auto pb-4">
        {messages.map((message) => {
          const isSent = message.senderId._id === currentUser._id || message.senderId === currentUser._id;
          return (
            <MessageBubble key={message._id} message={message} isSent={isSent} />
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
