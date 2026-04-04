import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Phone, Volume2 } from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { getInitials } from '../../utils/formatTime';

const CallOverlay = () => {
  const { 
    callState, 
    callPartner, 
    remoteStream, 
    isMuted,
    answerCall, 
    rejectCall, 
    endCall,
    toggleMute 
  } = useCall();

  const audioRef = useRef(null);
  const [duration, setDuration] = useState(0);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const resolveUrl = (url) => url?.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  // Play ringtone using standard HTML5 Audio to avoid thread freezes
  useEffect(() => {
    let audio = null;

    if (callState === 'ringing' || callState === 'calling') {
      // Free public domain simplistic ringtone
      audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
      audio.loop = true;
      audio.volume = 0.5;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.log('Audio autoplay blocked by browser:', e));
      }
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [callState]);

  // Attach remote stream to audio element
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Handle call duration tick
  useEffect(() => {
    let tick;
    if (callState === 'connected') {
      tick = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(tick);
  }, [callState]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (callState === 'idle' || !callPartner) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-6 right-6 w-80 bg-bg-panel border border-border shadow-2xl rounded-2xl z-[500] overflow-hidden flex flex-col items-center p-6"
      >
        <audio ref={audioRef} autoPlay />

        {/* Status Indicator */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
            {callState === 'connected' ? (
              <span className="text-emerald-400 flex items-center gap-2">
                <Volume2 className="w-4 h-4 animate-pulse" /> Ongoing Call
              </span>
            ) : callState === 'ringing' ? (
              <span className="text-accent animate-pulse">Incoming Call</span>
            ) : (
              <span className="text-text-muted">Calling...</span>
            )}
          </div>
          {callState === 'connected' && (
            <span className="text-text-primary font-mono text-sm">{formatDuration(duration)}</span>
          )}
        </div>

        {/* Avatar */}
        <div className="relative mb-6">
          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-bg-secondary flex items-center justify-center ${callState === 'connected' ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-bg-panel' : ''}`}>
            {callPartner.avatarUrl ? (
              <img src={resolveUrl(callPartner.avatarUrl)} className="w-full h-full object-cover" alt="caller" />
            ) : (
              <span className="text-3xl font-bold text-white">{getInitials(callPartner.displayName || callPartner.username)}</span>
            )}
          </div>
          {callState !== 'connected' && (
            <div className="absolute inset-0 rounded-full border border-accent animate-ping opacity-50" />
          )}
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold text-text-primary mb-1">
          {callPartner.displayName || callPartner.username}
        </h3>
        <p className="text-text-muted text-sm mb-8">NexTalk Audio</p>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {callState === 'ringing' ? (
            <>
              <button 
                onClick={rejectCall}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <button 
                onClick={answerCall}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 animate-bounce"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </>
          ) : callState === 'calling' ? (
            <button 
              onClick={endCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-105"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-bg-secondary text-text-primary hover:bg-white/10'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button 
                onClick={endCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallOverlay;
