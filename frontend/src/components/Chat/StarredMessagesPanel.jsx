import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ArrowRight, StarOff, Star } from 'lucide-react';
import api from '../../api/axios';
import { formatPreviewTime } from '../../utils/formatTime';
import HighlightText from './HighlightText';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

export default function StarredMessagesPanel({ chatId, onClose, onScrollToMessage, onUnstarMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMessages = useCallback(async (mounted = true) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/messages/starred?chatId=${chatId}`);
      if (mounted) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      if (mounted) {
        setError('Failed to load starred messages.');
        console.error(err);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    let mounted = true;
    loadMessages(mounted);
    return () => { mounted = false; };
  }, [loadMessages]);

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
          <div className="py-20">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="py-10">
            <ErrorState message={error} onRetry={() => loadMessages()} />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No starred messages"
            description="Star messages to find them easily here."
          />
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
