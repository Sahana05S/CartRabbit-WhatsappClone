import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Trash, Loader2 } from 'lucide-react';
import { formatDuration } from '../../utils/formatTime';

export default function AudioRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef    = useRef([]);
  const timerRef          = useRef(null);
  const streamRef         = useRef(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => stopRecording(false); // Cleanup: stop recorder without sending
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (isUploading) return; // Wait for stop to complete before uploading
      };

      recorder.start();
      setIsRecording(true);
      setPermissionError(false);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Audio recording failed:', err);
      setPermissionError(true);
      setTimeout(onCancel, 3000); // Back to text mode after 3 seconds
    }
  };

  const stopRecording = (shouldSend = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!mediaRecorderRef.current) return;
    
    setIsUploading(true);
    stopRecording();
    
    // Slight delay to allow final data chunks to collect
    setTimeout(async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size < 1000) {
        // Too small/empty
        onCancel();
        return;
      }
      
      const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
      await onSend(file, duration);
      setIsUploading(false);
    }, 100);
  };

  const handleCancel = () => {
    stopRecording(false);
    onCancel();
  };

  if (permissionError) {
    return (
      <div className="flex-1 px-4 py-2 flex items-center justify-center text-red-400 text-sm italic animate-pulse">
        Microphone permission denied.
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-bg-panel/50 backdrop-blur-sm rounded-xl border border-white/5 animate-slide-up">
      {/* Dynamic mic icon with pulse */}
      <div className="relative">
        <Mic className={`w-5 h-5 text-red-500 ${isRecording ? 'animate-pulse' : ''}`} />
        {isRecording && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
      </div>

      <div className="flex-1 font-mono text-sm text-text-primary tracking-wider">
        {formatDuration(duration)}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCancel}
          disabled={isUploading}
          className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
        >
          <Trash className="w-5 h-5" />
        </button>
        <button
          onClick={handleSend}
          disabled={isUploading || duration < 1}
          className="p-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl shadow-lg ring-1 ring-accent/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
