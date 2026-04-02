import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { WifiOff, Loader2 } from 'lucide-react';

export default function NetworkStatus() {
  const { isConnected } = useSocket();
  const [show, setShow] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Show banner if either socket is disconnected OR browser is offline
    if (!isConnected || !isOnline) {
      setShow(true);
    } else {
      // Hide with a tiny delay when reconnected
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isOnline]);

  if (!show) return null;

  const isReconnecting = !isOnline || !isConnected;

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 mt-2 z-[100] animate-slide-up">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border text-sm font-medium transition-colors
        ${isOnline && isConnected 
          ? 'bg-green-500/10 border-green-500/20 text-green-500 backdrop-blur-md' 
          : 'bg-red-500/10 border-red-500/20 text-red-400 backdrop-blur-md'
        }
      `}>
        {isOnline && isConnected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Connected
          </>
        ) : (
          <>
            {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isOnline ? 'Connecting…' : 'Offline'}
          </>
        )}
      </div>
    </div>
  );
}
