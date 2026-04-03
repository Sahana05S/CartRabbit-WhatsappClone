import { useState, useRef } from 'react';
import { ArrowLeft, UserCircle, Bell, Shield, MessageSquare, Monitor, Sun, Moon, Volume2, Globe, Command, Eye, CheckCircle2, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

export default function SettingsPanel({ onClose }) {
  const { currentUser, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState(null); // null = menu list
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const settings = currentUser?.settings || {
    privacy: { lastSeen: true, onlineStatus: true, readReceipts: true },
    notifications: { sounds: true, desktop: true, preview: true },
    chat: { enterToSend: true },
    appearance: { chatWallpaper: { type: 'none', value: '' } }
  };

  const currentWallpaper = settings.appearance?.chatWallpaper || { type: 'none', value: '' };

  const WALLPAPER_PRESETS = [
    { id: 'none', name: 'Default', type: 'none', value: '', previewClass: 'bg-bg-primary' },
    { id: 'doodle-light', name: 'Doodle', type: 'preset', value: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', previewClass: 'bg-[#e5ddd5]' },
    { id: 'grad-teal', name: 'Teal', type: 'preset', value: 'linear-gradient(to right bottom, #11998e, #38ef7d)', previewClass: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d]' },
    { id: 'grad-blue', name: 'Ocean', type: 'preset', value: 'linear-gradient(to right bottom, #2193b0, #6dd5ed)', previewClass: 'bg-gradient-to-br from-[#2193b0] to-[#6dd5ed]' },
    { id: 'grad-dark', name: 'Midnight', type: 'preset', value: 'linear-gradient(to right bottom, #0f2027, #203a43, #2c5364)', previewClass: 'bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]' },
    { id: 'color-dark', name: 'Dark', type: 'color', value: '#0b141a', previewClass: 'bg-[#0b141a]' },
    { id: 'color-slate', name: 'Slate', type: 'color', value: '#1e293b', previewClass: 'bg-slate-800' },
    { id: 'color-emerald', name: 'Emerald', type: 'color', value: '#064e3b', previewClass: 'bg-emerald-900' },
  ];

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

  const handleCustomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post('/users/wallpaper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.user);
    } catch (err) {
      console.error('Custom wallpaper upload failed', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSetting = async (category, key) => {
    const current = settings[category]?.[key] ?? true;
    const nextValue = !current;
    
    // Web Push specific logic
    if (category === 'notifications' && key === 'desktop') {
      const { subscribeToPush, unsubscribeFromPush } = await import('../../utils/notifications');
      if (nextValue) {
        await subscribeToPush(currentUser);
      } else {
        await unsubscribeFromPush();
      }
    }

    updateSetting(category, key, nextValue);
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

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 flex flex-col custom-scrollbar">
          
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
              <SettingToggle 
                label="Message Preview" 
                desc="Show message text in desktop notifications" 
                icon={Eye}
                checked={settings.notifications.preview ?? true} 
                onToggle={() => toggleSetting('notifications', 'preview')} 
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
            <div className="space-y-6">
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

              <div className="border-t border-white/[0.03] pt-6">
                 <p className="text-[15px] font-medium text-text-primary mb-1">Chat Wallpaper</p>
                 <p className="text-[12px] text-text-muted mb-4">Choose a background for all your chats</p>
                 
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleCustomUpload} 
                   accept="image/*" 
                   className="hidden" 
                 />

                 <div className="grid grid-cols-4 gap-2">
                   <button
                     onClick={() => fileInputRef.current?.click()}
                     disabled={loading}
                     className={`relative aspect-[9/16] rounded-xl overflow-hidden transition-all duration-200 border-2 outline-none flex flex-col items-center justify-center gap-1.5 group bg-bg-secondary
                       ${currentWallpaper.type === 'custom' ? 'border-accent scale-95 shadow-accent/20 shadow-lg' : 'border-transparent hover:scale-95'}
                     `}
                     title="Upload Custom Image"
                   >
                     <Upload className="w-5 h-5 text-text-muted group-hover:text-accent-light transition-colors" />
                     <span className="text-[10px] text-text-muted font-medium">Custom</span>
                     {currentWallpaper.type === 'custom' && (
                       <div className="absolute bottom-1 right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center shadow-md z-10">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                       </div>
                     )}
                   </button>
                   {WALLPAPER_PRESETS.map(preset => {
                      const isSelected = currentWallpaper.value === preset.value && currentWallpaper.type === preset.type;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => updateSetting('appearance', 'chatWallpaper', { type: preset.type, value: preset.value })}
                          disabled={loading}
                          className={`relative aspect-[9/16] rounded-xl overflow-hidden transition-all duration-200 border-2 outline-none
                            ${isSelected ? 'border-accent scale-95 shadow-accent/20 shadow-lg' : 'border-transparent hover:scale-95'}
                            ${preset.previewClass}
                          `}
                          title={preset.name}
                        >
                          {isSelected && (
                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center shadow-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      );
                   })}
                 </div>
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
