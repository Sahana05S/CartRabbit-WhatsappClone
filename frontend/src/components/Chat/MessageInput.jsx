import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';

export default function MessageInput({ receiverId, onMessageSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || sending) return;

    try {
      setSending(true);
      const { data } = await api.post('/messages', { receiverId, text: cleanText });
      onMessageSent(data.message);
      setText('');
      textareaRef.current?.focus();
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket) socket.emit('stopTyping', { receiverId });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Minimal error handling, normally would show a toast here
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);

    if (socket && receiverId) {
      socket.emit('typing', { receiverId });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { receiverId });
      }, 1500);
    }
  };

  return (
    <form 
      onSubmit={handleSend}
      className="bg-bg-panel/60 backdrop-blur-md border-t border-white/[0.04] p-3 md:px-6 md:py-4 flex items-end gap-2 md:gap-4 relative z-10"
    >
      <div className="flex gap-1 md:gap-2 mb-1.5 md:mb-2 text-text-muted">
        <button type="button" className="p-2 hover:text-accent-light hover:bg-white/5 rounded-full transition-colors hidden sm:block">
          <Smile className="w-5 h-5" />
        </button>
        <button type="button" className="p-2 hover:text-accent-light hover:bg-white/5 rounded-full transition-colors">
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 bg-bg-secondary rounded-2xl flex items-center border border-white/[0.06] focus-within:border-accent/30 focus-within:ring-1 focus-within:ring-accent/20 transition-all shadow-sm relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="w-full bg-transparent text-text-primary px-4 py-3 min-h-[48px] max-h-[120px] resize-none focus:outline-none placeholder:text-text-muted text-sm my-auto custom-scrollbar"
        />
      </div>

      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="w-12 h-12 flex-shrink-0 bg-accent hover:bg-accent-dark text-white rounded-full flex items-center justify-center transition-all shadow-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
      >
        <Send className="w-5 h-5 ml-1" />
      </button>
    </form>
  );
}
