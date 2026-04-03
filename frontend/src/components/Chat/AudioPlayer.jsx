import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { formatDuration } from '../../utils/formatTime';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function AudioPlayer({ url, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Pause all other audio elements if needed (optional)
      document.querySelectorAll('audio').forEach(el => {
        if (el !== audioRef.current) el.pause();
      });
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * audioRef.current.duration;
  };

  const displayTime = currentTime > 0 ? currentTime : duration;

  return (
    <div className="flex items-center gap-3 py-2 min-w-[200px]">
      <audio ref={audioRef} src={fullUrl} preload="metadata" onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />
      
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex-shrink-0 bg-accent/20 text-accent-light rounded-full flex items-center justify-center hover:bg-accent/30 transition-all"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5 fill-accent-light" />
        ) : (
          <Play className="w-5 h-5 fill-accent-light ml-0.5" />
        )}
      </button>

      <div className="flex-1 space-y-1.5 cursor-pointer" onClick={handleProgressClick}>
        <div 
          ref={progressRef}
          className="h-1 bg-white/10 rounded-full relative overflow-hidden"
        >
          <div 
            className="absolute left-0 top-0 h-full bg-accent-light transition-all duration-100"
            style={{ width: `${(currentTime / (duration || audioRef.current?.duration || 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted font-medium">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
}
