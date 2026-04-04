import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatList from '../components/Sidebar/ChatList';
import MainChat from '../components/Chat/MainChat';
import ProfilePanel from '../components/Sidebar/ProfilePanel';
import SettingsPanel from '../components/Sidebar/SettingsPanel';
import NewChatPanel from '../components/Sidebar/NewChatPanel';
import StarredMessagesPanel from '../components/Chat/StarredMessagesPanel';
import NetworkStatus from '../components/ui/NetworkStatus';
import PushPermissionPrompt from '../components/ui/PushPermissionPrompt';
import { useUsers } from '../hooks/useUsers';

const ChatPage = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null, 'profile', 'settings', 'new-chat'
  
  const { users, loading, error, togglePinChat, toggleArchiveChat } = useUsers(selectedChatId);
  
  // Find current selected chat object from unified users list to stay reactive
  const selectedChat = users.find(u => u._id === selectedChatId) || null;

  return (
    <div className="flex h-screen w-full bg-bg-secondary text-text-primary overflow-hidden relative">
      <NetworkStatus />
      <PushPermissionPrompt />
      
      {/* Sidebar (Left Pane) */}
      <div className={`w-full md:w-[320px] lg:w-[400px] flex flex-col relative overflow-hidden z-10 border-r border-glass-border/30 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatList 
          users={users}
          loading={loading}
          activeChatId={selectedChatId}
          onSelectChat={(chat) => setSelectedChatId(chat._id)}
          togglePinChat={togglePinChat}
          toggleArchiveChat={toggleArchiveChat}
          onOpenProfile={() => setActivePanel('profile')}
          onOpenSettings={() => setActivePanel('settings')}
          onOpenNewChat={() => setActivePanel('new-chat')}
          onOpenStarred={() => setActivePanel('starred')}
        />

        {/* Sliding Sidebar Panels */}
        <AnimatePresence>
          {activePanel === 'profile' && (
            <ProfilePanel key="profile" onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'settings' && (
            <SettingsPanel key="settings" onClose={() => setActivePanel(null)} />
          )}
          {activePanel === 'new-chat' && (
            <NewChatPanel 
              key="new-chat" 
              onClose={() => setActivePanel(null)} 
              onSelectContact={(contact) => {
                setSelectedChatId(contact._id);
                setActivePanel(null);
              }}
            />
          )}
          {activePanel === 'starred' && (
            <StarredMessagesPanel 
              key="starred" 
              isGlobal={true}
              onClose={() => setActivePanel(null)}
              onScrollToMessage={(msgId) => {
                // Future enhancement: scroll to message in global context
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area (Right Pane) */}
      <div className={`flex-1 flex flex-col relative z-0 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <MainChat 
          selectedChat={selectedChat} 
          onBack={() => setSelectedChatId(null)} 
        />
      </div>
    </div>
  );
};

export default ChatPage;
