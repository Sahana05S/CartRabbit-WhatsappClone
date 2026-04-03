import { useState } from 'react';
import { ArrowLeft, UserCircle, Bell, Shield, MessageSquare, Monitor, Sun, Moon, Volume2, Globe, Command, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

export default function SettingsPanel({ onClose }) {
  const { currentUser, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState(null); // null = menu list
  const [loading, setLoading] = useState(false);

  const settings = currentUser?.settings || {
    privacy: { lastSeen: true, onlineStatus: true, readReceipts: true },
    notifications: { sounds: true, desktop: true },
    chat: { enterToSend: true }
  };

  const updateSetting = async (category, key, value) => {
    try {
      setLoading(true);
      const { data } = await api.patch('/users/settings', {
        [category]: { [key]: value }
      });
      updateUser(data.user);
    } catch (err) {
      console.error('Update settings failed', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (category, key) => {
    const current = settings[category]?.[key] ?? true;
    updateSetting(category, key, !current);
  };

  const categories = [
    { id: 'privacy',   label: 'Privacy',        icon: Shield,        desc: 'Last seen, online status' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,          desc: 'Message sounds' },
    { id: 'chat',      label: 'Chat Settings',  icon: MessageSquare, desc: 'Enter to send, theme' },
    { id: 'appearance', label: 'Appearance',     icon: Monitor,       desc: 'Theme, wallpaper' }
  ];

  if (activeCategory) {
    const CatIcon = categories.find(c => c.id === activeCategory)?.icon || Shield;
    const CatLabel = categories.find(c => c.id === activeCategory)?.label || '';

    return (
      <div className="absolute inset-0 bg-bg-secondary flex flex-col z-30 animate-slide-right">
        <div className="h-[108px] bg-bg-panel border-b border-border flex items-end px-6 pb-4 gap-6 shrink-0 transition-colors">
          <button onClick={() => setActiveCategory(null)} className="p-1 text-text-primary hover:bg-white/5 rounded-full transition-colors mb-0.5">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-[19px] font-semibold text-text-primary">{CatLabel}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 flex flex-col">
          
          {activeCategory === 'privacy' && (
            <>
              <SettingToggle 
                label="Last Seen" 
                desc="Show your last seen status to others" 
                icon={Eye}
                checked={settings.privacy.lastSeen} 
                onToggle={() => toggleSetting('privacy', 'lastSeen')} 
                disabled={loading}
              />
              <SettingToggle 
                label="Online Status" 
                desc="Show when you are currently online" 
                icon={Globe}
                checked={settings.privacy.onlineStatus} 
                onToggle={() => toggleSetting('privacy', 'onlineStatus')} 
                disabled={loading}
              />
              <SettingToggle 
                label="Read Receipts" 
                desc="Display blue ticks when messages have been read" 
                icon={CheckCircle2}
                checked={settings.privacy.readReceipts} 
                onToggle={() => toggleSetting('privacy', 'readReceipts')} 
                disabled={loading}
              />
            </>
          )}

          {activeCategory === 'notifications' && (
            <>
              <SettingToggle 
                label="Message Sounds" 
                desc="Play sounds for incoming messages" 
                icon={Volume2}
                checked={settings.notifications.sounds} 
                onToggle={() => toggleSetting('notifications', 'sounds')} 
                disabled={loading}
              />
              <SettingToggle 
                label="Desktop Notifications" 
                desc="Show browser notifications when NexTalk is in background" 
                icon={Monitor}
                checked={settings.notifications.desktop} 
                onToggle={() => toggleSetting('notifications', 'desktop')} 
                disabled={loading}
              />
            </>
          )}

          {activeCategory === 'chat' && (
            <>
              <SettingToggle 
                label="Enter to Send" 
                desc="Enter key sends the message while Shift+Enter adds a new line" 
                icon={Command}
                checked={settings.chat.enterToSend} 
                onToggle={() => toggleSetting('chat', 'enterToSend')} 
                disabled={loading}
              />
            </>
          )}

          {activeCategory === 'appearance' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent-light shrink-0">
                  {theme === 'dark' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-text-primary leading-snug">Current Theme</p>
                  <p className="text-[12px] text-text-muted mt-0.5">Switch between Dark and Light mode</p>
                </div>
                <button 
                   onClick={toggleTheme}
                   className="px-4 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent-light text-[13px] font-bold rounded-full transition-all uppercase tracking-wider"
                >
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-text-muted leading-relaxed mt-auto pb-4 px-2 opacity-60">
            Changes are saved automatically and synced across all your NexTalk devices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-bg-secondary flex flex-col z-30 animate-slide-right">
      <div className="h-[108px] bg-bg-panel border-b border-border flex items-end px-6 pb-4 gap-6 shrink-0 transition-colors">
        <button onClick={onClose} className="p-1 text-text-primary hover:bg-white/5 rounded-full transition-colors mb-0.5">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[19px] font-semibold text-text-primary">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto pt-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-bg-hover transition-all duration-200 group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-bg-secondary text-text-muted flex items-center justify-center group-hover:bg-accent/20 group-hover:text-accent-light transition-all">
              <cat.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 border-b border-white/[0.03] pb-4 -mb-4">
              <p className="text-[15px] font-medium text-text-primary leading-snug">{cat.label}</p>
              <p className="text-[12px] text-text-muted mt-0.5 truncate pr-8">{cat.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingToggle({ label, desc, icon: Icon, checked, onToggle, disabled }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent-light shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-medium text-text-primary leading-snug">{label}</p>
        <p className="text-[12px] text-text-muted mt-0.5 leading-snug">{desc}</p>
      </div>
      <button 
        disabled={disabled}
        onClick={onToggle}
        className={`w-9 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 relative
          ${checked ? 'bg-accent' : 'bg-white/10'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        `}
      >
        <div className={`w-3 h-3 bg-white rounded-full shadow-lg transform transition-transform duration-300
          ${checked ? 'translate-x-[16px]' : 'translate-x-0'}
        `} />
      </button>
    </div>
  );
}
