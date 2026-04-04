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
  ChevronDown,
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

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/* ─── Spring preset used for all menus ─────────────────────────────────────── */
const MENU_TRANSITION = { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 };
const EMOJI_TRANSITION = { type: 'spring', stiffness: 500, damping: 32, mass: 0.6 };

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
  isLastRead,
}) => {
  const { currentUser } = useAuth();
  const { decryptMsg } = useE2EE();

  const [isHovered, setIsHovered]       = useState(false);
  const [showMenu, setShowMenu]         = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showForward, setShowForward]   = useState(false);
  const [showInfo, setShowInfo]         = useState(false);
  const [copied, setCopied]             = useState(false);
  const [decryptState, setDecryptState] = useState(message.isE2EE ? 'pending' : 'plain');
  const [decryptedText, setDecryptedText] = useState(null);

  const menuRef   = useRef(null);
  const bubbleRef = useRef(null);
  const hoverTimer = useRef(null);

  /* ── Decryption ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!message.isE2EE) return;
    let cancelled = false;
    const run = async () => {
      const plaintext = await decryptMsg(message);
      if (cancelled) return;
      if (plaintext !== null) { setDecryptedText(plaintext); setDecryptState('decrypted'); }
      else setDecryptState('failed');
    };
    run();
    return () => { cancelled = true; };
  }, [message._id, message.isE2EE, decryptMsg]);

  /* ── Close menu on outside click ────────────────────────────────────────── */
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    // Tiny delay so the click that opened the menu doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [showMenu]);

  /* ── Mouse enter/leave with small delay to prevent flicker ─────────────── */
  const handleMouseEnter = () => {
    clearTimeout(hoverTimer.current);
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => {
      if (!showMenu) setIsHovered(false);
    }, 80);
  };

  /* ── Keep hovered while menu is open ───────────────────────────────────── */
  useEffect(() => {
    if (!showMenu) {
      // re-check after the menu closes
      hoverTimer.current = setTimeout(() => setIsHovered(false), 200);
    } else {
      clearTimeout(hoverTimer.current);
      setIsHovered(true);
    }
    return () => clearTimeout(hoverTimer.current);
  }, [showMenu]);

  const isStarred  = (message.starredBy || []).map(id => id?.toString?.() ?? id).includes(currentUser?._id?.toString());
  const displayText = message.isE2EE ? (decryptState === 'decrypted' ? decryptedText : null) : message.text;

  const handleReact = async (emoji) => {
    try { await api.post(`/messages/${message._id}/react`, { emoji }); }
    catch (err) { console.error('React failed', err); }
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

  /* ── Deleted message ────────────────────────────────────────────────────── */
  if (message.isDeletedForEveryone) {
    return (
      <div className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
        <div className={`px-4 py-2 flex items-center gap-2 opacity-50 rounded-2xl italic text-[13px] border border-border bg-bg-panel ${isSent ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
          <Trash2 className="w-3 h-3" />
          {isSent ? 'You deleted this message' : 'This message was deleted'}
        </div>
      </div>
    );
  }

  /* ── Menu items ─────────────────────────────────────────────────────────── */
  const menuItems = [
    { label: 'Reply',         icon: Reply,   action: () => { onReply?.(message); setShowMenu(false); } },
    { label: 'Forward',       icon: Forward, action: () => { setShowForward(true); setShowMenu(false); } },
    { label: isStarred ? 'Unstar' : 'Star', icon: Star, action: handleStar },
    { label: copied ? 'Copied!' : 'Copy',   icon: Copy, action: handleCopy },
    { label: 'Message Info',  icon: Info,    action: () => { setShowInfo(true); setShowMenu(false); } },
  ];

  /* ── Bubble shape classes ───────────────────────────────────────────────── */
  const bubbleBase = message.messageType === 'sticker'
    ? 'px-0 py-0 bg-transparent'
    : `px-3.5 py-2 shadow-sm ${isSent
        ? 'bg-[var(--bubble-out)] text-text-primary rounded-2xl rounded-tr-[4px]'
        : 'bg-[var(--bubble-in)] text-text-primary rounded-2xl rounded-tl-[4px]'}`;

  const highlighted = isHighlighted ? 'ring-2 ring-accent ring-offset-1 ring-offset-transparent' : '';
  const searchHit   = isSearchHit && !isSearchActive ? 'ring-1 ring-yellow-400/40' : '';
  const active      = isSearchActive ? 'ring-2 ring-yellow-400' : '';

  return (
    <motion.div
      id={`msg-${message._id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.13, ease: 'easeOut' }}
      className={`flex flex-col w-full ${isSent ? 'items-end' : 'items-start'} mb-1 px-3 relative`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-end gap-1 max-w-[72%] md:max-w-[60%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* ── Bubble ───────────────────────────────────────────────────────── */}
        <div className="relative" ref={bubbleRef}>

          {/* Quick emoji bar — floats ABOVE the bubble on hover */}
          <AnimatePresence>
            {isHovered && !showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 6 }}
                transition={EMOJI_TRANSITION}
                className={`absolute -top-10 ${isSent ? 'right-0' : 'left-0'} z-30
                  flex items-center gap-0.5 bg-bg-panel border border-border
                  rounded-full px-2 py-1 shadow-xl`}
              >
                {QUICK_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => handleReact(e)}
                    className="text-[15px] w-7 h-7 flex items-center justify-center rounded-full
                      hover:bg-bg-hover hover:scale-125 active:scale-110
                      transition-transform duration-100"
                  >
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── The actual bubble ─────────────────────────────────────────── */}
          <div
            onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
            className={`relative transition-colors duration-150 select-text
              ${bubbleBase} ${highlighted} ${searchHit} ${active}`}
          >
            {/* Forwarded */}
            {message.isForwarded && (
              <div className="flex items-center gap-1 mb-1 opacity-50">
                <Forward className="w-3 h-3 italic" />
                <span className="text-[10px] font-bold uppercase tracking-wider italic">Forwarded</span>
              </div>
            )}

            {/* Group sender name */}
            {message.chatType === 'group' && !isSent && (
              <p className="text-[11.5px] font-extrabold mb-0.5"
                style={{ color: message.senderId?.avatarColor || 'var(--accent-default)' }}>
                {message.senderId?.displayName || message.senderId?.username}
              </p>
            )}

            {/* Reply preview */}
            {message.replyTo?.messageId && (
              <button
                onClick={() => onScrollToReply?.(message.replyTo.messageId)}
                className={`w-full text-left mb-2 rounded-lg px-2 py-1.5 border-l-[3px] transition-all
                  hover:brightness-105 active:scale-[0.98]
                  ${isSent
                    ? 'bg-black/10 border-black/25'
                    : 'bg-black/5 dark:bg-white/5 border-[var(--accent-default)]'
                  }`}
              >
                <p className={`text-[10.5px] font-extrabold uppercase tracking-tight truncate
                  ${isSent ? 'text-black/50 dark:text-white/50' : 'text-[var(--accent-default)]'}`}>
                  {message.replyTo.senderName}
                </p>
                <p className="text-[12px] truncate opacity-75 mt-0.5">
                  {message.replyTo.previewText || 'Attachment'}
                </p>
              </button>
            )}

            {/* ── Content ───────────────────────────────────────────────── */}
            {message.messageType === 'audio' ? (
              <AudioPlayer
                url={message.attachment?.fileUrl}
                duration={message.attachment?.duration}
                variant={isSent ? 'dark' : 'light'}
              />
            ) : (message.messageType === 'image' || message.messageType === 'file') ? (
              <AttachmentMessage message={message} isSent={isSent} />
            ) : (message.messageType === 'gif' || message.messageType === 'sticker') ? (
              <div className="relative">
                <img
                  src={message.giphy?.mediaUrl}
                  alt={message.giphy?.title || 'Media'}
                  className={`rounded-xl object-contain ${
                    message.messageType === 'sticker' ? 'w-[148px] h-[148px]' : 'w-full max-h-[280px]'
                  }`}
                />
                {message.messageType === 'gif' && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                    <span className="text-[9px] font-black text-white tracking-widest">GIF</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[14.5px] leading-[1.45] break-words whitespace-pre-wrap">
                {message.isE2EE ? (
                  decryptState === 'pending'
                    ? <span className="italic opacity-40 text-[13px]">Decrypting…</span>
                    : decryptState === 'failed'
                    ? <span className="italic opacity-35 text-[13px]">(encrypted — keys unavailable)</span>
                    : <HighlightText text={decryptedText} query={searchQuery} />
                ) : (
                  <HighlightText text={message.text} query={searchQuery} />
                )}
              </p>
            )}

            {/* ── Meta row (time + ticks) ────────────────────────────────── */}
            <div className={`flex items-center justify-end gap-1 mt-1
              text-[10.5px] text-text-muted opacity-70
              ${message.messageType === 'sticker' ? 'absolute bottom-1 right-2 bg-black/30 rounded-full px-1.5 py-0.5 opacity-90' : ''}`}>
              {isStarred && <Star className="w-2.5 h-2.5 fill-current text-yellow-500" />}
              {message.isE2EE && decryptState === 'decrypted' && <Lock className="w-2.5 h-2.5" />}
              <span>{formatMessageTime(message.createdAt)}</span>
              {isLastRead && message.status === 'read' && (
                <span className="opacity-70 ml-0.5">
                  · Seen {formatMessageTime(message.updatedAt || message.createdAt)}
                </span>
              )}
              {isSent && (
                <span className="flex ml-0.5">
                  {message.status === 'read'
                    ? <CheckCheck className="w-[14px] h-[14px] text-[var(--accent-default)]" />
                    : message.status === 'delivered'
                    ? <CheckCheck className="w-[14px] h-[14px]" />
                    : <Check className="w-[14px] h-[14px]" />}
                </span>
              )}
            </div>

            {/* ── Chevron (WhatsApp-style) — inside bubble, top-right ──── */}
            <AnimatePresence>
              {isHovered && message.messageType !== 'sticker' && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08 }}
                  onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
                  className={`absolute top-0 right-0 w-[26px] h-[26px]
                    flex items-center justify-center rounded-br-none rounded-bl-lg rounded-tr-[inherit]
                    ${isSent
                      ? 'bg-gradient-to-bl from-[var(--bubble-out)] via-[var(--bubble-out)] to-transparent'
                      : 'bg-gradient-to-bl from-[var(--bubble-in)] via-[var(--bubble-in)] to-transparent'
                    } text-text-muted hover:text-text-primary transition-colors z-10`}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── Reactions chip ────────────────────────────────────────────── */}
          <AnimatePresence>
            {Object.keys(reactionCounts).length > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute -bottom-3.5 ${isSent ? 'right-2' : 'left-2'} z-10`}
              >
                <div className="bg-bg-panel shadow-md rounded-full px-2 py-0.5 flex items-center gap-1 border border-border">
                  {Object.keys(reactionCounts).map(emoji => (
                    <span key={emoji} className="text-[13px] leading-none">{emoji}</span>
                  ))}
                  {message.reactions.length > 1 && (
                    <span className="text-[10px] font-bold text-[var(--accent-default)] ml-0.5">
                      {message.reactions.length}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Dropdown context menu ─────────────────────────────────────── */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                transition={MENU_TRANSITION}
                style={{ transformOrigin: isSent ? 'top right' : 'top left' }}
                className={`absolute top-8 ${isSent ? 'right-0' : 'left-0'} z-[200]
                  bg-bg-panel border border-border rounded-xl
                  shadow-[0_8px_32px_rgba(0,0,0,0.28)] overflow-hidden min-w-[174px]`}
              >
                {menuItems.map(({ label, icon: Icon, action }, i) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-medium
                      flex items-center justify-between gap-4
                      hover:bg-bg-hover text-text-primary transition-colors duration-75"
                  >
                    <span>{label}</span>
                    <Icon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  </button>
                ))}
                <div className="h-px bg-border mx-2" />
                <button
                  onClick={() => { setShowDeleteMenu(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium
                    flex items-center justify-between gap-4
                    hover:bg-red-500/10 text-red-400 transition-colors duration-75"
                >
                  <span>Delete</span>
                  <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showDeleteMenu && (
        <DeleteMessageMenu
          isSent={isSent}
          onDeleteForMe={() => { onDeleteForMe(message._id); setShowDeleteMenu(false); }}
          onClose={() => setShowDeleteMenu(false)}
        />
      )}
      {showForward && <ForwardModal message={message} onClose={() => setShowForward(false)} />}
      {showInfo    && <MessageInfoPanel messageId={message._id} onClose={() => setShowInfo(false)} />}
    </motion.div>
  );
};

export default MessageBubble;
