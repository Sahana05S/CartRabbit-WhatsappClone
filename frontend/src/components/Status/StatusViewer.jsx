import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, MoreVertical, Loader2 } from 'lucide-react';
import { getInitials, formatPreviewTime } from '../../utils/formatTime';

const StatusViewer = ({ group, onClose, onDelete }) => {
  const { user, statuses } = group;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressView, setProgressView] = useState(0);
  const videoRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveUrl = (url) => url?.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  const currentStatus = statuses[currentIndex];

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
  }, [currentIndex, isPaused, currentStatus]);

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

      {currentStatus.caption && (
        <div className="absolute bottom-10 left-0 right-0 text-center px-4 z-10">
          <p className="text-white bg-black/50 inline-block px-4 py-2 rounded-lg backdrop-blur-sm">
            {currentStatus.caption}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default StatusViewer;
