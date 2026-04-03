import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatList from '../components/Sidebar/ChatList';
import MainChat from '../components/Chat/MainChat';
import ProfilePanel from '../components/Sidebar/ProfilePanel';
import SettingsPanel from '../components/Sidebar/SettingsPanel';
import NewChatPanel from '../components/Sidebar/NewChatPanel';
import NetworkStatus from '../components/ui/NetworkStatus';
import PushPermissionPrompt from '../components/ui/PushPermissionPrompt';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null, 'profile', 'settings', 'new-chat'

  return (
    <div className="flex h-screen w-full bg-bg-secondary text-text-primary overflow-hidden relative">
      <NetworkStatus />
      <PushPermissionPrompt />
      
      {/* Sidebar (Left Pane) */}
      <div className={`w-full md:w-[320px] lg:w-[400px] flex flex-col relative overflow-hidden z-10 border-r border-glass-border/30 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatList 
          activeChatId={selectedChat?._id}
          onSelectChat={setSelectedChat}
          onOpenProfile={() => setActivePanel('profile')}
          onOpenSettings={() => setActivePanel('settings')}
          onOpenNewChat={() => setActivePanel('new-chat')}
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
                setSelectedChat(contact);
                setActivePanel(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area (Right Pane) */}
      <div className={`flex-1 flex flex-col relative z-0 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <MainChat 
          selectedChat={selectedChat} 
          onBack={() => setSelectedChat(null)} 
        />
      </div>
    </div>
  );
};

export default ChatPage;
