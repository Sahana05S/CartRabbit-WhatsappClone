import { useState, useCallback, useEffect, useRef } from 'react';
import { formatMessageTime } from '../../utils/formatTime';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Reply, Trash2, Forward, Copy, Star, Check, Info } from 'lucide-react';
import DeleteMessageMenu from './DeleteMessageMenu';
import AttachmentMessage from './AttachmentMessage';
import HighlightText from './HighlightText';
import ForwardModal from './ForwardModal';
import MessageInfoPanel from './MessageInfoPanel';
import AudioPlayer from './AudioPlayer';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({
  message,
  isSent,
  isHighlighted,
  isSearchHit,
  isSearchActive,
  // isLastRead retained in signature for future Message Info panel usage
  // eslint-disable-next-line no-unused-vars
  isLastRead,
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
  const [showInfo,       setShowInfo]       = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [starLoading,    setStarLoading]    = useState(false);
  const [contextMenu,    setContextMenu]    = useState(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

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
            ? 'bg-bubble-out border-border text-text-muted opacity-60 rounded-br-[4px]'
            : 'bg-bubble-in border-border text-text-muted opacity-80 rounded-bl-[4px]'
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
          isSent ? 'justify-end' : 'justify-start'
        } group/bubble mb-1 relative rounded-xl transition-colors duration-200 ${
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
          <div 
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY });
            }}
            className={`max-w-[85vw] md:max-w-md rounded-lg px-4 py-2.5 relative transition-all
            ${isSent
              ? 'bg-bubble-out text-text-primary rounded-br-[4px]'
              : 'bg-bubble-in text-text-primary border border-border rounded-bl-[4px]'
            }
          `}>

            {/* Forwarded label */}
            {message.isForwarded && (
              <div className="flex items-center gap-1 mb-1.5 text-text-muted">
                <Forward className="w-3 h-3" />
                <span className="text-[11px] italic">Forwarded</span>
              </div>
            )}

            {/* Group sender name */}
            {message.chatType === 'group' && !isSent && (
              <div
                className="text-[12px] font-bold mb-1 tracking-tight"
                style={{ color: message.senderId?.avatarColor || '#7c3aed' }}
              >
                {message.senderId?.displayName || message.senderId?.username || 'Unknown'}
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
                    ${isSent ? 'border-accent-dark bg-black/5' : 'border-accent-light bg-black/5'}
                  `}
                >
                  <p className={`text-[11px] font-semibold mb-0.5 truncate ${isSent ? 'text-text-primary' : 'text-accent-light'}`}>
                    {rt.senderName || 'Unknown'}
                  </p>
                  <p className="text-[12px] truncate text-text-secondary">
                    {isRtText ? (truncated || 'Message') : mediaLabel}
                  </p>
                </button>
              );
            })()}

            {/* Message content */}
            {message.messageType === 'audio' ? (
              <AudioPlayer 
                url={message.attachment?.fileUrl} 
                duration={message.attachment?.duration} 
              />
            ) : (message.messageType === 'image' || message.messageType === 'file') ? (
              <AttachmentMessage message={message} isSent={isSent} />
            ) : (
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                <HighlightText text={message.text} query={searchQuery} />
              </p>
            )}

            {/* Time + read receipts + star indicator */}
            <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1.5 font-medium ${isSent ? 'text-text-muted' : 'text-text-muted'}`}>
              {/* Star indicator — only visible when starred */}
              {isStarred && (
                <Star className={`w-3 h-3 fill-current ${isSent ? 'text-yellow-300/80' : 'text-yellow-400/80'}`} />
              )}
              <span>{formatMessageTime(message.createdAt)}</span>
              {isSent && (
                <span className="flex items-center justify-center">
                  {/* Single tick — sent */}
                  {(!message.status || message.status === 'sent') && (
                    <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {/* Double tick gray — delivered */}
                  {message.status === 'delivered' && (
                    <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 6 7 17 3 13"></polyline>
                      <polyline points="22 6 13 17"></polyline>
                    </svg>
                  )}
                  {/* Double tick blue — read */}
                  {message.status === 'read' && (
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 6 7 17 3 13"></polyline>
                      <polyline points="22 6 13 17"></polyline>
                    </svg>
                  )}
                  {/* readAt is stored in message state — available for a future Message Info panel */}
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

          {/* Context Menu Modal placed absolutely based on coordinates */}
          {contextMenu && (
            <div
              className="fixed z-50 min-w-[200px] bg-bg-panel border border-border rounded-lg shadow-xl py-1"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { onReply?.(message); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors flex items-center justify-between">Reply <Reply className="w-[15px] h-[15px] text-text-muted" /></button>
              
              <button onClick={() => { setShowPicker(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors flex items-center justify-between">React <svg className="w-[15px] h-[15px] text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
              
              {copyText && (
                <button onClick={() => { handleCopy(); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors flex items-center justify-between">Copy <Copy className="w-[15px] h-[15px] text-text-muted" /></button>
              )}

              <button onClick={() => { handleStar(); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors flex items-center justify-between">{isStarred ? 'Unstar' : 'Star'} <Star className={`w-[15px] h-[15px] ${isStarred ? 'text-yellow-400 fill-current' : 'text-text-muted'}`} /></button>

              {!message.isDeletedForEveryone && (
                <button onClick={() => { setShowForward(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors flex items-center justify-between">Forward <Forward className="w-[15px] h-[15px] text-text-muted" /></button>
              )}

              {isSent && !message.isDeletedForEveryone && (
                <button onClick={() => { setShowInfo(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-text-primary transition-colors flex items-center justify-between">Message info <Info className="w-[15px] h-[15px] text-text-muted" /></button>
              )}
              
              <button onClick={() => { setShowDeleteMenu(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-bg-hover text-sm text-red-500 transition-colors flex items-center justify-between">Delete <Trash2 className="w-[15px] h-[15px] text-red-400" /></button>
            </div>
          )}

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

      {/* Message Info panel */}
      {showInfo && (
        <MessageInfoPanel messageId={message._id} onClose={() => setShowInfo(false)} />
      )}
    </>
  );
}
