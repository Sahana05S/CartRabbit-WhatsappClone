import { getInitials } from '../../utils/formatTime';

export default function ChatListItem({ user, isActive, isOnline, onClick }) {
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
          {/* We could add last message time here, but leaving it clean for now */}
        </div>
        <p className="text-xs text-text-muted truncate">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </button>
  );
}
