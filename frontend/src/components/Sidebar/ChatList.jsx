import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useSocket } from '../../context/SocketContext';
import ChatListItem from './ChatListItem';
import { ArchiveRestore, ArrowLeft, Users, SearchX, Archive } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';

export default function ChatList({ search, selectedUser, onSelectUser }) {
  const { users, loading, error, togglePinChat, toggleArchiveChat } = useUsers(selectedUser?._id);
  const { onlineUsers } = useSocket();
  const [showArchived, setShowArchived] = useState(false);

  if (loading) return <LoadingState type="chat-list" />;
  if (error) return <ErrorState message={error} compact />;
  if (users.length === 0) return <EmptyState icon={Users} title="No chats" description="Invite some friends to get started!" />;

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length === 0 && search) {
    return <EmptyState icon={SearchX} title="No results found" description={`No chats matching "${search}"`} />;
  }

  const pinned = filtered.filter(u => u.isPinned && !u.isArchived);
  const normal = filtered.filter(u => !u.isPinned && !u.isArchived);
  const archived = filtered.filter(u => u.isArchived);

  return (
    <div className="flex flex-col">
      {showArchived ? (
        <>
          <button 
            onClick={() => setShowArchived(false)} 
            className="flex items-center gap-3 px-5 py-3 text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors border-b border-white/[0.04]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Archived Chats</span>
          </button>
          {archived.length === 0 && (
            <EmptyState icon={Archive} title="No archived chats" />
          )}
          {archived.map((user) => (
            <ChatListItem
              key={user._id}
              user={user}
              isActive={selectedUser?._id === user._id}
              isOnline={onlineUsers.includes(user._id)}
              onClick={() => onSelectUser(user)}
              onTogglePin={() => togglePinChat(user._id)}
              onToggleArchive={() => toggleArchiveChat(user._id)}
            />
          ))}
        </>
      ) : (
        <>
          {archived.length > 0 && !search && (
            <button 
              onClick={() => setShowArchived(true)} 
              className="flex items-center gap-3 px-5 py-3 text-sm text-text-muted hover:bg-bg-hover transition-colors border-b border-white/[0.04]"
            >
              <ArchiveRestore className="w-4 h-4 text-accent-light" />
              <span className="font-medium">Archived</span>
              <span className="ml-auto text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-text-primary font-bold">{archived.length}</span>
            </button>
          )}
          
          {pinned.map((user) => (
            <ChatListItem
              key={user._id}
              user={user}
              isActive={selectedUser?._id === user._id}
              isOnline={onlineUsers.includes(user._id)}
              onClick={() => onSelectUser(user)}
              onTogglePin={() => togglePinChat(user._id)}
              onToggleArchive={() => toggleArchiveChat(user._id)}
            />
          ))}

          {normal.map((user) => (
            <ChatListItem
              key={user._id}
              user={user}
              isActive={selectedUser?._id === user._id}
              isOnline={onlineUsers.includes(user._id)}
              onClick={() => onSelectUser(user)}
              onTogglePin={() => togglePinChat(user._id)}
              onToggleArchive={() => toggleArchiveChat(user._id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
