import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission, subscribeToPush } from '../../utils/notifications';
import { useAuth } from '../../context/AuthContext';

export default function PushPermissionPrompt() {
  const { currentUser } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' && currentUser) {
      // Don't show immediately on login, wait 5 seconds
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleEnable = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPush(currentUser);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-bg-panel border border-accent/20 rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-slide-down">
      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent-light shrink-0">
        <Bell className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-text-primary">Enable Notifications</h3>
        <p className="text-xs text-text-muted mt-0.5">Don't miss messages when NexTalk is in the background.</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleEnable}
          className="px-4 py-1.5 bg-accent text-white text-[12px] font-bold rounded-lg hover:bg-accent-dark transition-colors"
        >
          Enable
        </button>
        <button 
          onClick={() => setShow(false)}
          className="p-1.5 text-text-muted hover:bg-white/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
