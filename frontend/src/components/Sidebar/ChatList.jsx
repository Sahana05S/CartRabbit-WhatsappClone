import { useUsers } from '../../hooks/useUsers';
import { useSocket } from '../../context/SocketContext';
import ChatListItem from './ChatListItem';
import { Loader2 } from 'lucide-react';

export default function ChatList({ search, selectedUser, onSelectUser }) {
  const { users, loading, error } = useUsers();
  const { onlineUsers } = useSocket();

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent-light" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm text-center p-4">{error}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-6 text-text-muted text-sm">
        No other users found. Invite some friends!
      </div>
    );
  }

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center p-6 text-text-muted text-sm">
        No users match "{search}"
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filtered.map((user) => (
        <ChatListItem
          key={user._id}
          user={user}
          isActive={selectedUser?._id === user._id}
          isOnline={onlineUsers.includes(user._id)}
          onClick={() => onSelectUser(user)}
        />
      ))}
    </div>
  );
}
