import { useState, useCallback } from 'react';
import { formatMessageTime } from '../../utils/formatTime';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Reply, Trash2, Forward, Copy, Star, Check } from 'lucide-react';
import DeleteMessageMenu from './DeleteMessageMenu';
import AttachmentMessage from './AttachmentMessage';
import HighlightText from './HighlightText';
import ForwardModal from './ForwardModal';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({
  message,
  isSent,
  isHighlighted,
  isSearchHit,
  isSearchActive,
  searchQuery,
  onReply,
  onScrollToReply,
  onDeleteForMe,
  onDeleteForEveryone,
  onStarToggle,         // (messageId, isStarred) => void  — update local state
}) {
  const { currentUser } = useAuth();
  const [showPicker,     setShowPicker]     = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showForward,    setShowForward]    = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [starLoading,    setStarLoading]    = useState(false);

  // ─── Derived state ────────────────────────────────────────────────────────
  const isStarred  = (message.starredBy || []).includes(currentUser?._id) ||
                     (message.starredBy || []).map(id => id?.toString?.() ?? id).includes(currentUser?._id?.toString());
  const isText     = !message.messageType || message.messageType === 'text';
  const hasCaption = !isText && message.text;
  const copyText   = isText ? message.text : (hasCaption ? message.text : null);

  // ─── Reactions ─────────────────────────────────────────────────────────────
  const handleReact = async (emoji) => {
    setShowPicker(false);
    try { await api.post(`/messages/${message._id}/react`, { emoji }); }
    catch (err) { console.error('Failed to react', err); }
  };

  const reactionCounts = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteForMe = async () => {
    setShowDeleteMenu(false);
    try {
      await api.delete(`/messages/${message._id}/for-me`);
      onDeleteForMe?.(message._id);
    } catch (err) { console.error('Delete for me failed', err); }
  };

  const handleDeleteForEveryone = async () => {
    setShowDeleteMenu(false);
    try { await api.delete(`/messages/${message._id}/for-everyone`); }
    catch (err) { console.error('Delete for everyone failed', err); }
  };

  // ─── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / non-https
      const ta = document.createElement('textarea');
      ta.value = copyText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyText]);

  // ─── Star ──────────────────────────────────────────────────────────────────
  const handleStar = async () => {
    if (starLoading) return;
    setStarLoading(true);
    try {
      const { data } = await api.post(`/messages/${message._id}/star`);
      onStarToggle?.(message._id, data.isStarred);
    } catch (err) { console.error('Star toggle failed', err); }
    finally { setStarLoading(false); }
  };

  // ─── Reply metadata ────────────────────────────────────────────────────────
  const hasReplyBlock = message.replyTo?.messageId;

  // ─── Deleted-for-everyone rendering ───────────────────────────────────────
  if (message.isDeletedForEveryone) {
    return (
      <div
        id={`msg-${message._id}`}
        className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div className={`rounded-2xl px-4 py-2.5 flex items-center gap-2 border
          ${isSent
            ? 'bg-accent/20 border-accent/20 text-white/40 rounded-br-[4px]'
            : 'bg-surface/50 border-white/[0.04] text-text-muted rounded-bl-[4px]'
          }
        `}>
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
          <p className="text-[13px] italic">
            {isSent ? 'You deleted this message' : 'This message was deleted'}
          </p>
          <span className="text-[10px] opacity-50 ml-1">{formatMessageTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  // ─── Normal bubble ────────────────────────────────────────────────────────
  return (
    <>
      <div
        id={`msg-${message._id}`}
        className={`flex w-full ${
          isSent ? 'justify-end animate-slide-up-right' : 'justify-start animate-slide-up-left'
        } group/bubble mb-2 relative rounded-xl transition-colors duration-200 ${
          isHighlighted   ? 'animate-highlight-flash' : ''
        } ${
          isSearchActive  ? 'ring-2 ring-accent/60 ring-offset-1 ring-offset-bg-primary rounded-2xl' : ''
        } ${
          isSearchHit && !isSearchActive ? 'bg-accent/[0.04] rounded-2xl' : ''
        }`}
        onMouseLeave={() => setShowPicker(false)}
      >
        <div className={`relative flex items-center ${isSent ? 'flex-row-reverse' : 'flex-row'} gap-1`}>

          {/* Emoji Picker Tray */}
          {showPicker && (
            <div className={`absolute -top-10 z-20 flex items-center gap-1 bg-surface border border-white/10 rounded-full px-2 py-1 shadow-lg animate-scale-in origin-bottom ${isSent ? 'right-8' : 'left-8'}`}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => handleReact(e)} className="hover:scale-125 transition-transform text-lg px-1">{e}</button>
              ))}
            </div>
          )}

          {/* Message Bubble */}
          <div className={`max-w-[85vw] md:max-w-md rounded-2xl px-4 py-2.5 relative shadow-sm transition-all
            ${isSent
              ? 'bg-accent text-white rounded-br-[4px]'
              : 'bg-surface text-text-primary border border-white/[0.04] rounded-bl-[4px]'
            }
          `}>

            {/* Forwarded label */}
            {message.isForwarded && (
              <div className={`flex items-center gap-1 mb-1.5 ${isSent ? 'text-white/50' : 'text-text-muted'}`}>
                <Forward className="w-3 h-3" />
                <span className="text-[11px] italic">Forwarded</span>
              </div>
            )}

            {/* Quoted reply block */}
            {hasReplyBlock && (() => {
              const rt          = message.replyTo;
              const isRtText    = !rt.messageType || rt.messageType === 'text';
              const displayText = rt.previewText || '';
              const truncated   = displayText.length > 80 ? displayText.slice(0, 80) + '…' : displayText;
              const mediaLabel  = !isRtText
                ? (rt.messageType === 'image' ? '📷 Photo'
                 : rt.messageType === 'audio' ? '🎵 Audio'
                 : rt.messageType === 'file'  ? '📎 File'
                 : '📎 Attachment')
                : null;
              return (
                <button
                  onClick={() => rt.messageId && onScrollToReply?.(rt.messageId.toString())}
                  className={`w-full text-left mb-2 rounded-lg overflow-hidden border-l-[3px] px-3 py-1.5 block transition-opacity hover:opacity-80
                    ${isSent ? 'border-white/50 bg-white/10' : 'border-accent/70 bg-accent/10'}
                  `}
                >
                  <p className={`text-[11px] font-semibold mb-0.5 truncate ${isSent ? 'text-white/80' : 'text-accent-light'}`}>
                    {rt.senderName || 'Unknown'}
                  </p>
                  <p className={`text-[12px] truncate ${isSent ? 'text-white/70' : 'text-text-secondary'}`}>
                    {isRtText ? (truncated || 'Message') : mediaLabel}
                  </p>
                </button>
              );
            })()}

            {/* Message content */}
            {message.messageType === 'image' || message.messageType === 'file'
              ? <AttachmentMessage message={message} isSent={isSent} />
              : <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                  <HighlightText text={message.text} query={searchQuery} />
                </p>
            }

            {/* Time + read receipts + star indicator */}
            <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1.5 font-medium ${isSent ? 'text-white/70' : 'text-text-muted'}`}>
              {/* Star indicator — only visible when starred */}
              {isStarred && (
                <Star className={`w-3 h-3 fill-current ${isSent ? 'text-yellow-300/80' : 'text-yellow-400/80'}`} />
              )}
              <span>{formatMessageTime(message.createdAt)}</span>
              {isSent && (
                <span className="flex items-center justify-center">
                  {(!message.status || message.status === 'sent') && (
                    <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {message.status === 'delivered' && (
                    <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 6 7 17 3 13"></polyline>
                      <polyline points="22 6 13 17"></polyline>
                    </svg>
                  )}
                  {message.status === 'read' && (
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 6 7 17 3 13"></polyline>
                      <polyline points="22 6 13 17"></polyline>
                    </svg>
                  )}
                </span>
              )}
            </div>

            {/* Reaction chips */}
            {Object.keys(reactionCounts).length > 0 && (
              <div className={`absolute -bottom-3 ${isSent ? 'right-2' : 'left-2'} flex items-center gap-1 animate-scale-in`}>
                <div className="bg-bg-panel border border-white/10 rounded-full px-1.5 py-0.5 text-[11px] flex items-center gap-1 shadow-sm hover:scale-110 active:scale-95 transition-transform cursor-default">
                  <span className="flex gap-0.5">
                    {Object.keys(reactionCounts).map(emoji => <span key={emoji}>{emoji}</span>)}
                  </span>
                  {message.reactions.length > 1 && (
                    <span className="text-text-muted font-semibold pl-0.5">{message.reactions.length}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hover action toolbar: Reply | React | Copy | Star | Forward | Delete */}
          <div className="hidden group-hover/bubble:flex flex-col items-center gap-1 transition-opacity opacity-0 group-hover/bubble:opacity-100">

            <button onClick={() => onReply?.(message)} className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-bg-hover transition-colors" title="Reply">
              <Reply className="w-[17px] h-[17px]" />
            </button>

            <button onClick={() => setShowPicker(!showPicker)} className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-bg-hover transition-colors" title="React">
              <svg className="w-[17px] h-[17px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Copy — only for text/captioned messages */}
            {copyText && (
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-full transition-colors ${copied ? 'text-green-400 bg-green-400/10' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
                title={copied ? 'Copied!' : 'Copy text'}
              >
                {copied ? <Check className="w-[17px] h-[17px]" /> : <Copy className="w-[17px] h-[17px]" />}
              </button>
            )}

            {/* Star / Unstar */}
            <button
              onClick={handleStar}
              disabled={starLoading}
              className={`p-1.5 rounded-full transition-colors ${
                isStarred
                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                  : 'text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10'
              } disabled:opacity-50`}
              title={isStarred ? 'Unstar' : 'Star'}
            >
              <Star className={`w-[17px] h-[17px] ${isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* Forward */}
            {!message.isDeletedForEveryone && (
              <button onClick={() => setShowForward(true)} className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-bg-hover transition-colors" title="Forward">
                <Forward className="w-[17px] h-[17px]" />
              </button>
            )}

            <button onClick={() => setShowDeleteMenu(true)} className="text-text-muted hover:text-red-400 p-1.5 rounded-full hover:bg-red-500/10 transition-colors" title="Delete">
              <Trash2 className="w-[17px] h-[17px]" />
            </button>
          </div>

        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteMenu && (
        <DeleteMessageMenu
          isSent={isSent}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onClose={() => setShowDeleteMenu(false)}
        />
      )}

      {/* Forward modal */}
      {showForward && (
        <ForwardModal message={message} onClose={() => setShowForward(false)} />
      )}
    </>
  );
}
