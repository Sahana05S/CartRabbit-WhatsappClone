import { useState, useEffect } from 'react';
import { getInitials, formatLastSeen } from '../../utils/formatTime';
import { useSocket } from '../../context/SocketContext';
import { MoreVertical, Search, Video, Phone } from 'lucide-react';

export default function ChatHeader({ user }) {
  const { onlineUsers, socket } = useSocket();
  const isOnline = onlineUsers.includes(user._id);
  const [lastSeen, setLastSeen] = useState(user.lastSeen);

  useEffect(() => {
    setLastSeen(user.lastSeen);
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleUserOffline = ({ userId, lastSeen: newLastSeen }) => {
      if (userId === user._id) setLastSeen(newLastSeen);
    };
    socket.on('userOffline', handleUserOffline);
    return () => socket.off('userOffline', handleUserOffline);
  }, [socket, user._id]);

  return (
    <header className="h-[72px] px-6 border-b border-white/[0.04] flex items-center justify-between bg-bg-panel/40 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className="avatar w-10 h-10 shadow-sm"
            style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
          >
            {getInitials(user.username)}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#161d2e] rounded-full" />
          )}
        </div>
        
        <div>
          <h2 className="text-base font-semibold text-text-primary leading-tight">
            {user.username}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {isOnline 
              ? 'online' 
              : lastSeen 
                ? `last seen ${formatLastSeen(lastSeen)}` 
                : 'offline'
            }
          </p>
        </div>
      </div>

      {/* Action buttons (Visual only for now, as standard in WhatsApp web) */}
      <div className="flex items-center gap-3">
        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
