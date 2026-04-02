import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight, StarOff } from 'lucide-react';
import api from '../../api/axios';
import { formatPreviewTime } from '../../utils/formatTime';
import HighlightText from './HighlightText';

export default function StarredMessagesPanel({ chatId, onClose, onScrollToMessage, onUnstarMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/messages/starred?chatId=${chatId}`)
      .then((res) => {
        if (mounted) {
          setMessages(res.data.messages || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError('Failed to load starred messages.');
          console.error(err);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [chatId]);

  const handleUnstar = async (e, messageId) => {
    e.stopPropagation(); // prevent scrolling to message
    try {
      await api.post(`/messages/${messageId}/star`);
      // Optimistically remove from list
      setMessages(prev => prev.filter(m => m._id !== messageId));
      if (onUnstarMessage) {
        onUnstarMessage(messageId);
      }
    } catch (err) {
      console.error('Failed to unstar from panel:', err);
    }
  };

  return (
    <div className="w-[320px] sm:w-[350px] flex flex-col bg-bg-panel border-l border-white/[0.06] h-full flex-shrink-0 animate-slide-left">
      {/* Header */}
      <div className="h-[72px] flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        <h2 className="text-text-primary font-semibold">Starred Messages</h2>
        <button
          onClick={onClose}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent-light" />
          </div>
        ) : error ? (
          <div className="text-center text-sm text-red-400 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-muted p-8 text-sm flex flex-col items-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl opacity-60">⭐</span>
            </div>
            <p>No starred messages</p>
            <p className="text-[11px] mt-1 opacity-70">Star messages to find them easily here.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isText = !message.messageType || message.messageType === 'text';
            const hasCaption = !isText && message.text;

            return (
              <div
                key={message._id}
                className="bg-bg-secondary border border-white/[0.04] rounded-xl p-3 flex flex-col gap-2 hover:bg-bg-hover transition-colors cursor-pointer group"
                onClick={() => onScrollToMessage(message._id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-accent-light truncate max-w-[150px]">
                    {message.senderId?.username || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">
                      {formatPreviewTime(message.createdAt)}
                    </span>
                    <button
                      onClick={(e) => handleUnstar(e, message._id)}
                      className="p-1 rounded-md text-text-muted hover:text-yellow-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                      title="Unstar"
                    >
                      <StarOff className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="text-[13px] text-text-primary line-clamp-3">
                  {message.isDeletedForEveryone ? (
                    <span className="italic text-text-muted opacity-70">This message was deleted</span>
                  ) : !isText ? (
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <span>{message.messageType === 'image' ? '📷 Photo' : '📎 File'}</span>
                      {hasCaption && (
                        <>
                          <span className="mx-1 opacity-50">•</span>
                          <span className="text-text-primary truncate">{message.text}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <HighlightText text={message.text} query="" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
