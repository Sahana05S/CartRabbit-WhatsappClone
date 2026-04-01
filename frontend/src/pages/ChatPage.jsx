import { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar selectedUser={selectedUser} onSelectUser={setSelectedUser} />
      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
}
