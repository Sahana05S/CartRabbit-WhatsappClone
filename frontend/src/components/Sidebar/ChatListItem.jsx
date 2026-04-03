import { getInitials, formatPreviewTime } from '../../utils/formatTime';
import { useAuth } from '../../context/AuthContext';
import { Pin, Archive, PinOff, ArchiveRestore, Users } from 'lucide-react';

export default function ChatListItem({ user, isActive, isOnline, onClick, onTogglePin, onToggleArchive }) {
  const { currentUser } = useAuth();
  
  const lastMessage = user.lastMessage;
  const isMe = lastMessage && (
    lastMessage.senderId?._id === currentUser?._id || 
    lastMessage.senderId === currentUser?._id
  );

  return (
    <div
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-4 py-3 border-b border-border transition-all text-left cursor-pointer relative
        ${isActive ? 'bg-bg-active' : 'hover:bg-bg-hover'}
      `}
    >
      <div className="relative flex-shrink-0">
        <div
          className="avatar w-12 h-12"
          style={{ backgroundColor: user.avatarColor || 'var(--accent-default)' }}
        >
          {getInitials(user.username)}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-bg-panel rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className={`flex items-center gap-1.5 text-sm truncate pr-2 ${user.unreadCount > 0 ? 'font-bold text-accent' : 'font-semibold text-text-primary'}`}>
            {user.isGroup && <Users className="w-3.5 h-3.5 flex-shrink-0 text-text-muted opacity-80" />}
            <span className="truncate">{user.username}</span>
          </h3>
          {lastMessage?.createdAt && (
            <span className={`text-[10px] flex-shrink-0 ml-2 ${user.unreadCount > 0 ? 'text-accent font-bold' : 'text-text-muted'}`}>
              {formatPreviewTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className={`text-xs truncate flex-1 ${user.unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
            {lastMessage ? (() => {
              if (lastMessage.isDeletedForEveryone) return 'This message was deleted';
              const prefix = isMe ? <span className="opacity-70 font-normal">You: </span> : null;
              let body;
              if (lastMessage.messageType === 'image') {
                body = '📷 Photo';
              } else if (lastMessage.messageType === 'file') {
                body = `📎 ${lastMessage.attachment?.fileName || 'File'}`;
              } else {
                body = lastMessage.text || '';
              }
              return <>{prefix}{body}</>;
            })() : (isOnline ? 'Online' : 'Offline')}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {user.isPinned && <Pin className="w-3 h-3 text-text-muted rotate-45" />}
            {user.unreadCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center">
                {user.unreadCount > 99 ? '99+' : user.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-panel backdrop-blur-sm p-1 rounded-lg border border-border shadow-xl z-10 ${isActive ? 'bg-bg-active' : 'group-hover:bg-bg-hover'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          className="p-1.5 text-text-muted hover:text-accent-light rounded-md hover:bg-white/10"
          title={user.isPinned ? "Unpin chat" : "Pin chat"}
        >
          {user.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
          className="p-1.5 text-text-muted hover:text-accent-light rounded-md hover:bg-white/10"
          title={user.isArchived ? "Unarchive chat" : "Archive chat"}
        >
          {user.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
