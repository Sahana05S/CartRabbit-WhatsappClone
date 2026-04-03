import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Import Pages & Components
import AuthPage from './AuthPage';
import OAuthSuccess from './OAuthSuccess';
import ChatList from './ChatList';
import MainChat from './MainChat';
import ProfilePanel from './ProfilePanel';
import SettingsPanel from './SettingsPanel';
import NewChatPanel from './NewChatPanel';

// Mock Protected Route (Actual implementation would use AuthContext)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = true; // Logic: const { user } = useContext(AuthContext)
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const ChatPage = () => {
  const [activeChatId, setActiveChatId] = useState(null);
  const [activePanel, setActivePanel] = useState(null); // null, 'profile', 'settings', 'new-chat'

  return (
    <div className="flex h-screen w-full bg-dark-bg text-[#e9edef] overflow-hidden selection:bg-primary/30">
      {/* Sidebar (Left Pane) */}
      <div className={`w-full md:w-[30%] lg:w-[35%] flex flex-col relative overflow-hidden z-10 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <ChatList 
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
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
              onSelectContact={(id) => {
                setActiveChatId(id);
                setActivePanel(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area (Right Pane) */}
      <div className={`flex-1 flex flex-col relative z-0 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <MainChat 
          activeChat={activeChatId} 
          onBack={() => setActiveChatId(null)} 
        />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg antialiased">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/auth/google/success" element={<OAuthSuccess />} />
          
          {/* Protected Chat Route */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route path="*" element={<Navigate to="/chat" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
