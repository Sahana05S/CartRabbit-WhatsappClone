import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, 
  Trash2, 
  Forward, 
  Copy, 
  Star, 
  Check, 
  Info, 
  Lock, 
  CheckCheck,
  MoreHorizontal,
  Smile,
  ChevronDown
} from 'lucide-react';
import { formatMessageTime } from '../../utils/formatTime';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useE2EE } from '../../context/E2EEContext';
import AttachmentMessage from './AttachmentMessage';
import HighlightText from './HighlightText';
import AudioPlayer from './AudioPlayer';
import DeleteMessageMenu from './DeleteMessageMenu';
import ForwardModal from './ForwardModal';
import MessageInfoPanel from './MessageInfoPanel';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageBubble = ({
  message,
  isSent,
  isHighlighted,
  isSearchHit,
  isSearchActive,
  searchQuery,
  onReply,
  onScrollToReply,
  onDeleteForMe,
  onStarToggle,
  isLastRead
}) => {
  const { currentUser } = useAuth();
  const { decryptMsg } = useE2EE();
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [decryptState, setDecryptState] = useState(message.isE2EE ? 'pending' : 'plain');
  const [decryptedText, setDecryptedText] = useState(null);

  useEffect(() => {
    if (!message.isE2EE) return;
    let cancelled = false;
    const run = async () => {
      const plaintext = await decryptMsg(message);
      if (cancelled) return;
      if (plaintext !== null) {
        setDecryptedText(plaintext);
        setDecryptState('decrypted');
      } else {
        setDecryptState('failed');
      }
    };
    run();
    return () => { cancelled = true; };
  }, [message._id, message.isE2EE, decryptMsg]);

  const isStarred = (message.starredBy || []).map(id => id?.toString?.() ?? id).includes(currentUser?._id?.toString());
  const displayText = message.isE2EE ? (decryptState === 'decrypted' ? decryptedText : null) : message.text;

  const handleReact = async (emoji) => {
    setShowPicker(false);
    try { await api.post(`/messages/${message._id}/react`, { emoji }); }
    catch (err) { console.error('Failed to react', err); }
  };

  const reactionCounts = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const handleCopy = useCallback(async () => {
    if (!displayText) return;
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  }, [displayText]);

  const handleStar = async () => {
    try {
      const { data } = await api.post(`/messages/${message._id}/star`);
      onStarToggle?.(message._id, data.isStarred);
      setShowMenu(false);
    } catch (err) { console.error('Star toggle failed', err); }
  };

  if (message.isDeletedForEveryone) {
    return (
      <div className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
        <div className={`glass-card px-4 py-2 flex items-center gap-2 opacity-60 rounded-2xl italic text-[13px] ${isSent ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
          <Trash2 className="w-3 h-3" />
          {isSent ? 'You deleted this message' : 'This message was deleted'}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      id={`msg-${message._id}`}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`flex flex-col w-full ${isSent ? 'items-end' : 'items-start'} mb-2 group/msg px-4 relative`}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      <div className={`flex items-start gap-2 max-w-[85%] md:max-w-[70%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Message Bubble Container */}
        <div className="relative group/bubble">
          <div 
            className={`relative rounded-2xl transition-all duration-300 ${message.messageType === 'sticker' 
              ? 'px-0 py-0 bg-transparent' 
              : 'px-4 py-2.5 shadow-sm ' + (isSent ? 'bg-[var(--bubble-out)] text-text-primary rounded-tr-none' : 'bg-[var(--bubble-in)] text-text-primary rounded-tl-none')
            } ${isHighlighted ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-primary' : ''}`}
          >
            {/* Forwarded Header */}
            {message.isForwarded && (
              <div className={`flex items-center gap-1 mb-1 opacity-50 ${message.messageType === 'sticker' ? 'px-4 pt-2' : ''}`}>
                <Forward className="w-3 h-3 italic" />
                <span className="text-[10px] font-bold uppercase tracking-wider italic">Forwarded</span>
              </div>
            )}

            {/* Sender Name (Groups) */}
            {message.chatType === 'group' && !isSent && (
              <p className={`text-[12px] font-black mb-1 opacity-80 ${message.messageType === 'sticker' ? 'px-4 pt-2' : ''}`} style={{ color: message.senderId?.avatarColor || 'var(--accent-default)' }}>
                {message.senderId?.displayName || message.senderId?.username}
              </p>
            )}

            {/* Reply Block */}
            {message.replyTo?.messageId && (
              <div className={message.messageType === 'sticker' ? 'px-4 py-1' : ''}>
                <button 
                  onClick={() => onScrollToReply?.(message.replyTo.messageId)}
                  className={`w-full text-left mb-2 rounded-lg p-2 border-l-4 transition-all hover:brightness-110 ${isSent 
                    ? 'bg-black/10 border-black/30' 
                    : 'bg-black/5 dark:bg-white/5 border-accent'
                  }`}
                >
                  <p className={`text-[11px] font-black uppercase tracking-tighter truncate ${isSent ? 'text-black/60 dark:text-white/60' : 'text-accent'}`}>
                    {message.replyTo.senderName}
                  </p>
                  <p className={`text-[12px] truncate opacity-80 text-text-primary`}>
                    {message.replyTo.previewText || 'Attachment'}
                  </p>
                </button>
              </div>
            )}

            {/* Main Content */}
            <div className="relative">
              {message.messageType === 'audio' ? (
                <AudioPlayer url={message.attachment?.fileUrl} duration={message.attachment?.duration} variant={isSent ? 'dark' : 'light'} />
              ) : (message.messageType === 'image' || message.messageType === 'file') ? (
                <AttachmentMessage message={message} isSent={isSent} />
              ) : (message.messageType === 'gif' || message.messageType === 'sticker') ? (
                <div className={`relative ${message.messageType === 'sticker' ? 'p-0' : ''}`}>
                  <img 
                    src={message.giphy?.mediaUrl} 
                    alt={message.giphy?.title || 'Media'} 
                    className={`rounded-xl object-contain ${
                      message.messageType === 'sticker' 
                        ? 'w-[160px] h-[160px]' 
                        : 'w-full max-h-[300px]'
                    }`} 
                  />
                  {message.messageType === 'gif' && (
                    <div className="absolute bottom-2 left-2 px-1 rounded bg-black/40 backdrop-blur-sm">
                      <span className="text-[10px] font-black text-white/90">GIF</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium">
                  {message.isE2EE ? (
                    decryptState === 'pending' ? <span className="italic opacity-50">Decrypting...</span> :
                    decryptState === 'failed' ? <span className="italic opacity-50 flex items-center gap-1" title="Private keys are wiped on logout for safety. Old messages are now undecipherable locally."><Lock className="w-3 h-3" /> Undecipherable (keys reset)</span> :
                    <HighlightText text={decryptedText} query={searchQuery} />
                  ) : <HighlightText text={message.text} query={searchQuery} />}
                </div>
              )}
            </div>

            {/* Meta Info Trace (Time + Status) */}
            <div className={`flex items-center justify-end gap-1.5 mt-1.5 opacity-60 text-[10px] font-bold ${
              message.messageType === 'sticker' 
                ? 'text-text-muted mt-1 w-full justify-end' 
                : 'text-text-muted'
              }`}>
              {isStarred && <Star className="w-3 h-3 fill-current text-yellow-500" />}
              {message.isE2EE && decryptState !== 'failed' && <Lock className="w-3 h-3" />}
              <span>{formatMessageTime(message.createdAt)}</span>
              {isLastRead && message.status === 'read' && <span className="ml-1 uppercase tracking-tighter opacity-70">Seen at {formatMessageTime(message.updatedAt || message.createdAt)}</span>}
              {isSent && (
                <div className="flex">
                  {message.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-accent" /> :
                   message.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> :
                   <Check className="w-3.5 h-3.5" />}
                </div>
              )}
            </div>

            {/* Hover Actions Trigger */}
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-2 ${isSent ? 'left-[-40px]' : 'right-[-40px]'} p-1.5 rounded-full bg-bg-panel border border-border opacity-0 group-hover/bubble:opacity-100 transition-all hover:text-accent z-10 text-text-muted shadow-lg`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Reaction Overlay */}
          <AnimatePresence>
            {Object.keys(reactionCounts).length > 0 && (
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`absolute -bottom-3 ${isSent ? 'right-2' : 'left-2'} flex gap-1 z-10`}
              >
                  <div className="bg-bg-panel shadow-lg rounded-full px-2 py-0.5 flex items-center gap-1 border border-border text-text-primary">
                  {Object.keys(reactionCounts).map(emoji => <span key={emoji} className="text-xs">{emoji}</span>)}
                  {message.reactions.length > 1 && <span className="text-[10px] font-bold text-accent ml-0.5">{message.reactions.length}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Menu (WhatsApp Style Below Bubble) */}
        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`absolute top-full mt-2 ${isSent ? 'right-0' : 'left-0'} z-[101] bg-bg-panel rounded-xl py-2 min-w-[170px] shadow-2xl border border-border text-text-primary overflow-hidden`}
              >
                <div className="px-3 py-1.5 border-b border-border mb-1 bg-bg-secondary/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Message Options</p>
                </div>
                <button onClick={() => { onReply?.(message); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold flex items-center justify-between group">
                  Reply <Reply className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </button>
                <button onClick={() => { setShowForward(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold flex items-center justify-between group">
                  Forward <Forward className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </button>
                <button onClick={() => { setShowPicker(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold flex items-center justify-between group">
                  React <Smile className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </button>
                <button onClick={handleStar} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold flex items-center justify-between group">
                  {isStarred ? 'Unstar' : 'Star'} <Star className={`w-4 h-4 ${isStarred ? 'text-yellow-500 fill-current' : 'text-text-muted group-hover:text-yellow-500'} transition-colors`} />
                </button>
                <button onClick={handleCopy} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold flex items-center justify-between group">
                  {copied ? 'Copied!' : 'Copy'} <Copy className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </button>
                <button onClick={() => { setShowInfo(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold flex items-center justify-between group">
                  Message Info <Info className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </button>
                <div className="border-t border-border my-1" />
                <button onClick={() => { setShowDeleteMenu(true); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 hover:bg-bg-hover text-[13px] font-semibold text-red-500 flex items-center justify-between group">
                  Delete <Trash2 className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setShowPicker(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className={`absolute bottom-[calc(100%+10px)] ${isSent ? 'right-0' : 'left-0'} z-[101] bg-bg-panel rounded-full p-2 flex gap-1 shadow-2xl border border-border`}
              >
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => handleReact(e)} className="hover:scale-125 hover:bg-bg-hover transition-all text-lg px-2 py-1 rounded-full">{e}</button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showDeleteMenu && <DeleteMessageMenu isSent={isSent} onDeleteForMe={() => { onDeleteForMe(message._id); setShowDeleteMenu(false); }} onClose={() => setShowDeleteMenu(false)} />}
      {showForward && <ForwardModal message={message} onClose={() => setShowForward(false)} />}
      {showInfo && <MessageInfoPanel messageId={message._id} onClose={() => setShowInfo(false)} />}
    </motion.div>
  );
};

export default MessageBubble;
