import { getInitials, formatPreviewTime } from '../../utils/formatTime';
import { useAuth } from '../../context/AuthContext';

export default function ChatListItem({ user, isActive, isOnline, onClick }) {
  const { currentUser } = useAuth();
  
  const lastMessage = user.lastMessage;
  const isMe = lastMessage && (
    lastMessage.senderId?._id === currentUser?._id || 
    lastMessage.senderId === currentUser?._id
  );

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] transition-all text-left
        ${isActive ? 'bg-bg-active border-l-2 border-l-accent pl-[14px]' : 'hover:bg-bg-hover border-l-2 border-l-transparent'}
      `}
    >
      <div className="relative flex-shrink-0">
        <div
          className="avatar w-12 h-12 shadow-sm"
          style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
        >
          {getInitials(user.username)}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-bg-panel rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-sm font-semibold text-text-primary truncate pr-2">
            {user.username}
          </h3>
          {lastMessage?.createdAt && (
            <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
              {formatPreviewTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">
          {lastMessage ? (
            <>
              {isMe && <span className="opacity-70">You: </span>}
              {lastMessage.text}
            </>
          ) : (
            isOnline ? 'Online' : 'Offline'
          )}
        </p>
      </div>
    </button>
  );
}
