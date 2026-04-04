import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  X, 
  FileText, 
  Smile, 
  Mic, 
  Image as ImageIcon,
  MoreVertical,
  Plus,
  Loader2
} from 'lucide-react';
import GifPicker from './GifPicker';
import AudioRecorder from './AudioRecorder';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useE2EE } from '../../context/E2EEContext';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export default function MessageInput({ receiverId, isGroup, onMessageSent, replyTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { socket } = useSocket();
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { isE2EEReady, encryptFor } = useE2EE();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentRef.current && !attachmentRef.current.contains(event.target)) {
        setShowAttachments(false);
      }
    };
    if (showAttachments) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachments]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socket && receiverId) {
      socket.emit('typing', { receiverId, isGroup, username: currentUser.username });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit('stopTyping', { receiverId, isGroup }), 1500);
    }
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setUploadError('');
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanText = text.trim();
    if ((!cleanText && !pendingFile) || sending) return;

    try {
      setSending(true);
      setUploadError('');

      let payload;
      let sentMessage;

      if (pendingFile) {
        const formData = new FormData();
        formData.append('file', pendingFile.file);
        formData.append('receiverId', receiverId);
        if (isGroup) formData.append('isGroup', 'true');
        if (cleanText) formData.append('caption', cleanText);
        
        if (replyTo) {
          formData.append('replyTo', JSON.stringify({
            messageId: replyTo._id,
            senderId: replyTo.senderId?._id || replyTo.senderId,
            senderName: replyTo.senderName,
            previewText: replyTo.previewText || '',
            messageType: replyTo.messageType || 'text',
          }));
        }

        const { data } = await api.post('/messages/attachment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        sentMessage = data.message;
        clearPendingFile();
      } else {
        const shouldEncrypt = false; // E2EE disabled: all messages sent as plaintext
        let e2eeEnvelope = null;

        if (shouldEncrypt) {
          e2eeEnvelope = await encryptFor(receiverId, cleanText);
        }

        if (e2eeEnvelope) {
          payload = { receiverId, text: '', isE2EE: true, e2ee: e2eeEnvelope };
        } else {
          payload = { receiverId, text: cleanText };
          if (isGroup) payload.isGroup = true;
        }

        if (replyTo) {
          payload.replyTo = {
            messageId: replyTo._id,
            senderId: replyTo.senderId?._id || replyTo.senderId,
            senderName: replyTo.senderName,
            previewText: e2eeEnvelope ? '🔒 Encrypted message' : (replyTo.previewText || replyTo.text || ''),
            messageType: replyTo.messageType || 'text',
          };
        }

        const { data } = await api.post('/messages', payload);
        sentMessage = data.message;
      }

      onMessageSent(sentMessage);
      setText('');
      setShowEmojiPicker(false);
      onCancelReply?.();
      textareaRef.current?.focus();
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket) socket.emit('stopTyping', { receiverId, isGroup });

    } catch (err) {
      console.error('Send error:', err);
      setUploadError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setUploadError('File too large (max 50MB)');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, isImage });
    setShowAttachments(false);
  };

  const handleSendGif = async (gif) => {
    try {
      setSending(true);
      const { data } = await api.post('/messages', {
        receiverId,
        text: '',
        messageType: 'gif',
        giphy: {
          id: gif.id,
          mediaUrl: gif.images.fixed_height.url,
          previewUrl: gif.images.fixed_height_small_still.url,
          width: parseInt(gif.images.fixed_height.width),
          height: parseInt(gif.images.fixed_height.height),
          title: gif.title
        },
        isGroup
      });
      onMessageSent(data.message);
      setShowEmojiPicker(false);
    } catch (err) {
      setUploadError('Failed to send GIF');
    } finally {
      setSending(false);
    }
  };

  const handleSendSticker = async (sticker) => {
    try {
      setSending(true);
      const { data } = await api.post('/messages', {
        receiverId,
        text: '',
        messageType: 'sticker',
        giphy: {
          id: sticker.id,
          mediaUrl: sticker.images.fixed_height.url,
          previewUrl: sticker.images.fixed_height_small_still.url,
          width: parseInt(sticker.images.fixed_height.width),
          height: parseInt(sticker.images.fixed_height.height),
          title: sticker.title
        },
        isGroup
      });
      onMessageSent(data.message);
      setShowEmojiPicker(false);
    } catch (err) {
      setUploadError('Failed to send sticker');
    } finally {
      setSending(false);
    }
  };

  const handleSendAudioRecord = async (file, duration) => {
    try {
      setSending(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', receiverId);
      if (isGroup) formData.append('isGroup', 'true');
      formData.append('messageType', 'voice');
      formData.append('duration', duration);

      const { data } = await api.post('/messages/attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onMessageSent(data.message);
      setIsRecording(false);
    } catch (err) {
      setUploadError('Failed to send voice note');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative bg-bg-panel border-t border-border px-4 py-3 md:px-6">
      <AnimatePresence>
        {uploadError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-6 mb-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-red-500 text-xs font-bold"
          >
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-1 mb-1 relative" ref={attachmentRef}>
          <button 
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            className={`btn-ghost ${showAttachments ? 'bg-primary/20 text-primary scale-110' : ''}`}
          >
            <Plus className={`w-6 h-6 transition-transform ${showAttachments ? 'rotate-45' : ''}`} />
          </button>

          <AnimatePresence>
            {showAttachments && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full left-0 mb-4 glass-card-heavy p-2 rounded-2xl flex flex-col gap-1 min-w-[200px] shadow-2xl z-50 border border-glass-border"
              >
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-2 hover:bg-glass rounded-xl text-left transition-all">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><ImageIcon className="w-5 h-5" /></div>
                  <span className="text-sm font-bold">Image or Video</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-2 hover:bg-glass rounded-xl text-left transition-all">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><FileText className="w-5 h-5" /></div>
                  <span className="text-sm font-bold">Document</span>
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`btn-ghost ${showEmojiPicker ? 'bg-primary/20 text-primary scale-110' : ''}`}
          >
            <Smile className="w-6 h-6" />
          </button>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl"
              >
                <GifPicker 
                  onEmojiClick={(e) => { setText(t => t + e.emoji); setShowEmojiPicker(false); }}
                  onGifSelect={handleSendGif}
                  onStickerSelect={handleSendSticker}
                  theme={theme}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 flex flex-col bg-bg-panel border border-border rounded-2xl overflow-hidden focus-within:shadow-accent/5 transition-all">
          <AnimatePresence>
            {pendingFile && (
              <motion.div 
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="px-4 py-3 bg-accent/5 flex items-center justify-between border-b border-border"
              >
                <div className="flex items-center gap-3">
                  {pendingFile.isImage ? <img src={pendingFile.previewUrl} className="w-10 h-10 object-cover rounded-lg" /> : <FileText className="w-8 h-8 text-accent" />}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{pendingFile.file.name}</p>
                    <p className="text-[10px] text-accent font-black uppercase tracking-widest">READY</p>
                  </div>
                </div>
                <button onClick={clearPendingFile} className="btn-ghost scale-75 text-red-400"><X /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={pendingFile ? 'Add a caption...' : 'Type your message...'}
            className="w-full bg-transparent text-text-primary px-4 py-3.5 outline-none resize-none min-h-[48px] max-h-[160px] text-[15px] font-medium custom-scrollbar placeholder:text-text-muted/40"
            rows={1}
          />
        </div>

        {text.trim() || pendingFile ? (
          <button 
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/20 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0 mb-1"
          >
            {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
          </button>
        ) : (
          <button 
            type="button"
            onClick={() => setIsRecording(true)}
            className="w-12 h-12 rounded-full bg-bg-panel border border-border flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-text-muted hover:text-accent mb-1 flex-shrink-0"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-dark-sidebar z-50 flex items-center px-6"
          >
            <AudioRecorder 
              onCancel={() => setIsRecording(false)} 
              onSend={handleSendAudioRecord} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
