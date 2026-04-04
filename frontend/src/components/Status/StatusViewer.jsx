import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, MoreVertical, Loader2, Eye, Send, Reply } from 'lucide-react';
import { getInitials, formatPreviewTime } from '../../utils/formatTime';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const StatusViewer = ({ group, onClose, onDelete }) => {
  const { user, statuses } = group;
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressView, setProgressView] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const videoRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveUrl = (url) => url?.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  const currentStatus = statuses[currentIndex];
  const isOwner = user._id === currentUser._id;

  // View Status API
  useEffect(() => {
    if (!currentStatus || isOwner) return;
    
    // We only call the view endpoint if we aren't the owner
    // and ideally if we haven't already marked it seen in this session
    api.post(`/status/${currentStatus._id}/view`).catch(err => console.error('Failed to view status', err));
  }, [currentStatus, isOwner]);

  useEffect(() => {
    setProgressView(0);
    if (!currentStatus) return;

    if (currentStatus.type === 'video') {
      // Logic handled by the onTimeUpdate of the video element
      setIsPaused(false);
      return;
    }

    let timer;
    let tick;
    if (!isPaused) {
      // Image/Text shown for 5 seconds
      const duration = 5000;
      const interval = 50; 
      const step = (interval / duration) * 100;

      tick = setInterval(() => {
        setProgressView(prev => {
          if (prev >= 100) {
            handleNext();
            return 100;
          }
          return prev + step;
        });
      }, interval);
    }

    return () => clearInterval(tick);
  }, [currentIndex, isPaused, currentStatus, showViewers, isReplying]);

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleVideoProgress = (e) => {
    const { currentTime, duration } = e.target;
    if (duration > 0) {
      setProgressView((currentTime / duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    handleNext();
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      // Send a direct message back to the status owner
      await api.post('/messages', {
        receiverId: user._id,
        chatType: 'direct',
        text: replyText.trim(),
        replyTo: {
          messageId: currentStatus._id,
          senderId: user._id,
          senderName: user.displayName || user.username,
          previewText: currentStatus.type === 'image' 
            ? '📷 Status Photo' 
            : currentStatus.type === 'video' 
              ? '🎥 Status Video' 
              : `Status: ${currentStatus.content}`,
          messageType: currentStatus.type
        }
      });
      setReplyText('');
      setIsReplying(false);
      setIsPaused(false);
    } catch (err) {
      console.error('Failed to reply to status', err);
    }
  };

  if (!currentStatus) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md"
    >
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Progress Bars */}
        <div className="flex gap-1">
          {statuses.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{ 
                  width: idx < currentIndex ? '100%' : (idx === currentIndex ? `${progressView}%` : '0%') 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={resolveUrl(user.avatarUrl)} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{getInitials(user.displayName || user.username)}</span>
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold">{user.displayName || user.username}</h2>
              <p className="text-white/70 text-xs">{formatPreviewTime(currentStatus.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="w-full max-w-lg h-full max-h-[85vh] relative rounded-2xl overflow-hidden mt-8 flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {currentStatus.type === 'image' && (
          <img 
            src={resolveUrl(currentStatus.content)} 
            className="w-full h-full object-contain"
            alt="Status"
          />
        )}
        
        {currentStatus.type === 'video' && (
          <video
            ref={videoRef}
            src={resolveUrl(currentStatus.content)}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            onTimeUpdate={handleVideoProgress}
            onEnded={handleVideoEnded}
            onPause={() => setIsPaused(true)}
            onPlay={() => setIsPaused(false)}
          />
        )}

        {currentStatus.type === 'text' && (
          <div 
            className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
            style={{ backgroundColor: currentStatus.bgColor || '#00a884' }}
          >
            <p className="text-white text-3xl font-semibold leading-relaxed" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              {currentStatus.content}
            </p>
          </div>
        )}

        {/* Prev / Next Hit areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
      </div>

      {currentStatus.caption && !isReplying && !showViewers && (
        <div className="absolute bottom-24 left-0 right-0 text-center px-4 z-10 pointer-events-none">
          <p className="text-white bg-black/50 inline-block px-4 py-2 rounded-lg backdrop-blur-sm pointer-events-auto">
            {currentStatus.caption}
          </p>
        </div>
      )}

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
        {isOwner ? (
          <div className="flex flex-col items-center w-full max-w-lg cursor-pointer group pb-4" 
               onClick={() => {
                 setShowViewers(!showViewers);
                 setIsPaused(!showViewers);
               }}>
            <div className="flex items-center gap-2 mt-4 transition-transform group-hover:-translate-y-1">
              <Eye className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">{currentStatus.viewers?.length || 0} views</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg pb-4">
             {isReplying ? (
                <form onSubmit={handleReplySubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply..."
                    className="flex-1 bg-black/50 text-white border border-white/20 rounded-full px-5 py-3 outline-none backdrop-blur-sm focus:border-white/50 transition-colors"
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    disabled={!replyText.trim()}
                    className="w-12 h-12 bg-accent hover:bg-accent-light rounded-full flex items-center justify-center transition-colors disabled:opacity-50 text-white p-0"
                  >
                    <Send className="w-5 h-5 ml-[-2px] mt-[1px]" />
                  </button>
                </form>
             ) : (
                <button 
                  onClick={() => {
                    setIsReplying(true);
                    setIsPaused(true);
                  }}
                  className="mx-auto flex items-center gap-2 text-white bg-black/50 px-6 py-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
             )}
          </div>
        )}
      </div>

      {/* Viewers Sheet */}
      <AnimatePresence>
        {showViewers && isOwner && (
          <motion.div
            initial={{ y: '100% border-t' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-bg-secondary rounded-t-3xl shadow-2xl overflow-hidden z-30 max-h-[60vh] max-w-lg mx-auto border-t border-border"
          >
            <div className="sticky top-0 bg-bg-secondary p-4 border-b border-border flex items-center justify-between z-10">
              <h3 className="text-text-primary font-bold text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" /> Viewed by {currentStatus.viewers?.length || 0}
              </h3>
              <button 
                onClick={() => {
                  setShowViewers(false);
                  setIsPaused(false);
                }} 
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 custom-scrollbar flex flex-col gap-3 min-h-[200px]">
              {currentStatus.viewers && currentStatus.viewers.length > 0 ? (
                currentStatus.viewers.map(viewer => (
                  <div key={viewer._id} className="flex items-center gap-3 p-2 hover:bg-bg-hover rounded-xl transition-colors">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden shrink-0"
                      style={{ backgroundColor: viewer.avatarUrl ? 'transparent' : (viewer.avatarColor || '#00a884') }}
                    >
                      {viewer.avatarUrl ? (
                         <img src={resolveUrl(viewer.avatarUrl)} className="w-full h-full object-cover" />
                      ) : (
                        viewer.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">{viewer.displayName || viewer.username}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-text-muted mt-8">
                  <p>No views yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StatusViewer;
