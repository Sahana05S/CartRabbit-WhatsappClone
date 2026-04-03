import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image, Smile, Mic, Play, Box } from 'lucide-react';
import GifPicker from './GifPicker';
import AudioRecorder from './AudioRecorder';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageInput({ receiverId, isGroup, onMessageSent, replyTo, onCancelReply }) {
  const [text,           setText]          = useState('');
  const [sending,        setSending]        = useState(false);
  const [pendingFile,    setPendingFile]    = useState(null);   // { file, previewUrl, isImage }
  const [uploadError,    setUploadError]    = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording,    setIsRecording]    = useState(false);
  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();
  const { theme } = useTheme();
  const { currentUser } = useAuth();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // Focus when reply selected
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [pendingFile]);

  // Handle outside clicks to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiObj) => {
    const cursorPosition = textareaRef.current?.selectionStart || text.length;
    const newText = text.slice(0, cursorPosition) + emojiObj.emoji + text.slice(textareaRef.current?.selectionEnd || text.length);
    setText(newText);

    // Set focus and maintain cursor position after React re-render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPosition + emojiObj.emoji.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';           // allow re-selecting same file
    if (!file) return;

    setUploadError('');

    if (file.size > MAX_BYTES) {
      setUploadError(`File too large (max 50 MB). Selected: ${formatBytes(file.size)}`);
      return;
    }

    const isImage     = file.type.startsWith('image/');
    const isVideo     = file.type.startsWith('video/');
    const previewUrl  = (isImage || isVideo) ? URL.createObjectURL(file) : null;
    setPendingFile({ file, previewUrl, isImage, isVideo });
    textareaRef.current?.focus();
  };

  const clearPendingFile = () => {
    if (pendingFile?.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
    setPendingFile(null);
    setUploadError('');
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (!file) continue;

        e.preventDefault(); // Stop the default paste into textarea
        setUploadError('');

        if (file.size > MAX_BYTES) {
          setUploadError(`File too large (max 50 MB). Pasted: ${formatBytes(file.size)}`);
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        
        // Browsers often name pasted files just "image.png"
        const fileName = file.name === 'image.png' ? `pasted-image-${Date.now()}.png` : file.name;
        const finalFile = new File([file], fileName, { type: file.type });

        setPendingFile({ file: finalFile, previewUrl, isImage: true });
        textareaRef.current?.focus();
        break; // Only capture the first image if multiple paste items exist
      }
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanText = text.trim();
    if ((!cleanText && !pendingFile) || sending) return;

    try {
      setSending(true);
      setUploadError('');

      let sentMessage;

      if (pendingFile) {
        // ── Attachment send ────────────────────────────────
        const formData = new FormData();
        formData.append('file',       pendingFile.file);
        formData.append('receiverId', receiverId);
        if (isGroup) formData.append('isGroup', 'true');
        if (cleanText) formData.append('caption', cleanText);

        if (replyTo) {
          formData.append('replyTo', JSON.stringify({
            messageId:   replyTo._id,
            senderId:    replyTo.senderId?._id || replyTo.senderId,
            senderName:  replyTo.senderName,
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
        // ── Text-only send ─────────────────────────────────
        const payload = { receiverId, text: cleanText };
        if (isGroup) payload.isGroup = true;
        if (replyTo) {
          payload.replyTo = {
            messageId:   replyTo._id,
            senderId:    replyTo.senderId?._id || replyTo.senderId,
            senderName:  replyTo.senderName,
            previewText: replyTo.previewText || replyTo.text || '',
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
      console.error('Send message error:', err);
      setUploadError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSendGif = async (gif) => {
    try {
      setSending(true);
      const payload = { 
        receiverId, 
        messageType: 'gif',
        giphy: {
          id: gif.id,
          mediaUrl: gif.images.original.url,
          previewUrl: gif.images.fixed_width.url,
          width: parseInt(gif.images.original.width),
          height: parseInt(gif.images.original.height),
          title: gif.title
        }
      };
      if (isGroup) payload.isGroup = true;
      if (replyTo) {
        payload.replyTo = {
          messageId:   replyTo._id,
          senderId:    replyTo.senderId?._id || replyTo.senderId,
          senderName:  replyTo.senderName,
          previewText: replyTo.previewText || replyTo.text || 'GIF',
          messageType: 'gif'
        };
      }
      const { data } = await api.post('/messages', payload);
      onMessageSent(data.message);
      setShowEmojiPicker(false);
      onCancelReply?.();
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Send GIF error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendSticker = async (sticker) => {
    try {
      setSending(true);
      const payload = { 
        receiverId, 
        messageType: 'sticker',
        giphy: {
          id: sticker.id,
          mediaUrl: sticker.images.original.url,
          previewUrl: sticker.images.fixed_width.url,
          width: parseInt(sticker.images.original.width),
          height: parseInt(sticker.images.original.height),
          title: sticker.title
        }
      };
      if (isGroup) payload.isGroup = true;
      if (replyTo) {
        payload.replyTo = {
          messageId:   replyTo._id,
          senderId:    replyTo.senderId?._id || replyTo.senderId,
          senderName:  replyTo.senderName,
          previewText: replyTo.previewText || replyTo.text || 'Sticker',
          messageType: 'sticker'
        };
      }
      const { data } = await api.post('/messages', payload);
      onMessageSent(data.message);
      setShowEmojiPicker(false);
      onCancelReply?.();
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Send sticker error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (audioFile, duration) => {
    try {
      setSending(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('file',       audioFile);
      formData.append('receiverId', receiverId);
      formData.append('duration',   duration);
      if (isGroup) formData.append('isGroup', 'true');

      if (replyTo) {
        formData.append('replyTo', JSON.stringify({
          messageId:   replyTo._id,
          senderId:    replyTo.senderId?._id || replyTo.senderId,
          senderName:  replyTo.senderName,
          previewText: replyTo.previewText || '',
          messageType: replyTo.messageType || 'text',
        }));
      }

      const { data } = await api.post('/messages/attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onMessageSent(data.message);
      setIsRecording(false);
      onCancelReply?.();

    } catch (err) {
      console.error('Audio upload error:', err);
      setUploadError('Failed to send voice message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    const enterToSend = currentUser?.settings?.chat?.enterToSend ?? true;
    
    if (e.key === 'Enter') {
      if (enterToSend) {
        if (!e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      } else {
        // If enterToSend is false, Enter alone just adds a newline (default behavior)
        // Shift+Enter should send if we want to follow some apps, but usually 
        // if enterToSend is false, people want Enter to be newline and click Send to send.
        // I will make Shift+Enter send when Enter is newline.
        if (e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      }
    }
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socket && receiverId) {
      socket.emit('typing', { receiverId, isGroup });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit('stopTyping', { receiverId, isGroup }), 1500);
    }
  };

  const canSend = (text.trim() || pendingFile) && !sending;

  return (
    <div className="bg-bg-secondary border-t border-border relative z-10 transition-colors">

      {/* File preview strip */}
      {pendingFile && (
        <div className="mx-3 md:mx-6 mt-3 flex items-center gap-3 bg-bg-secondary border border-border rounded-xl px-3 py-2 animate-slide-up">
          {pendingFile.isImage ? (
            <img src={pendingFile.previewUrl} alt="preview" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
          ) : pendingFile.isVideo ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-black">
              <video src={pendingFile.previewUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center">
                  <span className="block w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-gray-800 border-b-[4px] border-b-transparent ml-0.5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-accent-light" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-text-primary truncate">{pendingFile.file.name}</p>
            <p className="text-[11px] text-text-muted">{formatBytes(pendingFile.file.size)}</p>
          </div>
          <button onClick={clearPendingFile} className="p-1 rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="mx-3 md:mx-6 mt-1 text-[12px] text-red-400 animate-fade-in">
          {uploadError}
        </p>
      )}

      {/* Input row */}
      <div className="p-3 md:px-6 md:py-4 flex items-end gap-2 md:gap-4">
        {isRecording ? (
          <AudioRecorder 
            onSend={handleSendAudio} 
            onCancel={() => setIsRecording(false)} 
          />
        ) : (
          <form onSubmit={handleSend} className="flex-1 flex items-end gap-2 md:gap-4">

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={handleFileSelect}
            />

            {/* Attachment buttons */}
            <div className="flex gap-1 md:gap-2 mb-1.5 md:mb-2 text-text-muted relative" ref={emojiPickerRef}>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-4 z-50 animate-slide-up origin-bottom-left shadow-2xl">
                  <GifPicker
                    onEmojiClick={handleEmojiClick}
                    onGifSelect={handleSendGif}
                    onStickerSelect={handleSendSticker}
                    theme={theme}
                  />
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-accent-light bg-accent/10' : 'hover:text-accent-light hover:bg-white/5'}`}
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full transition-colors ${pendingFile ? 'text-accent-light bg-accent/10' : 'hover:text-accent-light hover:bg-white/5'}`}
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            {/* Text area */}
            <div className="flex-1 bg-bg-active rounded-xl flex items-center border border-transparent focus-within:border-border transition-all relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={pendingFile ? 'Add a caption…' : 'Type a message…'}
                rows={1}
                className="w-full bg-transparent text-text-primary px-4 py-3 min-h-[48px] max-h-[120px] resize-none focus:outline-none placeholder:text-text-muted text-sm my-auto custom-scrollbar"
              />
            </div>

            {/* Action button: Send or Mic */}
            {canSend ? (
              <button
                type="submit"
                disabled={sending}
                className="w-12 h-12 flex-shrink-0 bg-accent hover:bg-accent-dark text-white rounded-full flex items-center justify-center transition-all shadow-accent active:scale-95"
              >
                {sending
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Send className="w-5 h-5 ml-0.5" />
                }
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="w-12 h-12 flex-shrink-0 bg-accent/10 hover:bg-accent/20 text-accent-light rounded-full flex items-center justify-center transition-all active:scale-95"
                title="Voice message"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
