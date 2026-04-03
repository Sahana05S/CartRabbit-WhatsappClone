import { useState, useRef } from 'react';
import { ArrowLeft, UserCircle, Bell, Shield, MessageSquare, Monitor, Sun, Moon, Volume2, Globe, Command, Eye, CheckCircle2, Upload, Lock, Key, Copy, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

export default function SettingsPanel({ onClose }) {
  const { currentUser, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState(null); // null = menu list
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // MFA Flow States
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState(null);
  const [mfaError, setMfaError] = useState('');

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

  const initMfaSetup = async () => {
    try {
      setLoading(true);
      setMfaError('');
      const { data } = await api.post('/auth/mfa/setup');
      setMfaSetupData(data.data);
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Failed to initialize MFA.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnableMfa = async () => {
    try {
      setLoading(true);
      setMfaError('');
      const { data } = await api.post('/auth/mfa/verify-enable', { token: mfaToken });
      
      setMfaRecoveryCodes(data.data.recoveryCodes);
      setMfaSetupData(null);
      setMfaToken('');
      
      updateUser({ ...currentUser, mfaEnabled: true, mfaEnabledAt: new Date().toISOString() });
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!window.confirm("Are you sure? This will permanently invalidate all your existing recovery codes!")) return;
    try {
      setLoading(true);
      setMfaError('');
      const { data } = await api.post('/auth/mfa/regenerate-recovery-codes');
      setMfaRecoveryCodes(data.data.recoveryCodes);
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Failed to regenerate codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCodes = () => {
    if (!mfaRecoveryCodes) return;
    const content = `NexTalk Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\n${mfaRecoveryCodes.join('\n')}\n\nKeep these secure. They are your only way to log in if you lose your authenticator app.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nextalk-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'privacy',   label: 'Privacy',        icon: Shield,        desc: 'Last seen, online status' },
    { id: 'security',  label: 'Security',       icon: Lock,          desc: 'Two-step verification (MFA)' },
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
          <button onClick={() => {
            setActiveCategory(null);
            setMfaSetupData(null);
            setMfaRecoveryCodes(null);
            setMfaToken('');
            setMfaError('');
          }} className="p-1 text-text-primary hover:bg-white/5 rounded-full transition-colors mb-0.5">
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

          {activeCategory === 'security' && (
            <div className="space-y-6">
              
              {/* If MFA is newly enabled and we have recovery codes to show exactly ONCE */}
              {mfaRecoveryCodes ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Two-Step Verification is ON</h3>
                  </div>
                  <p className="text-sm text-emerald-100/70 mb-4 leading-relaxed">
                    Save these recovery codes in a secure place. This is the <strong>only time</strong> they will be shown. You can use them to sign in if you lose a device.
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-bg-primary/50 p-4 rounded-xl font-mono text-sm text-text-primary">
                    {mfaRecoveryCodes.map((code, idx) => (
                      <div key={idx} className="tracking-widest">{code}</div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { navigator.clipboard.writeText(mfaRecoveryCodes.join('\n')); alert('Copied to clipboard!') }} className="flex-1 py-2 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors text-sm font-semibold border border-border">
                      Copy
                    </button>
                    <button onClick={handleDownloadCodes} className="flex-1 py-2 rounded-lg bg-bg-secondary hover:bg-bg-hover transition-colors text-sm font-semibold border border-border">
                      Download
                    </button>
                  </div>
                </div>
              ) : currentUser.mfaEnabled ? (
                
                /* MFA is already enabled, show regular status */
                <div className="flex flex-col items-center bg-bg-panel border border-border rounded-3xl p-8 text-center shadow-sm">
                   <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-500/5">
                     <Shield className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-text-primary mb-2">MFA is Active</h3>
                   <p className="text-sm text-text-muted mb-6">
                     Your account is protected by an extra layer of security.
                   </p>
                   
                   {mfaError && (
                     <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-xl border border-red-400/20 w-full mb-4">
                       <AlertTriangle className="w-4 h-4 shrink-0" />
                       {mfaError}
                     </div>
                   )}

                   <div className="flex flex-col gap-3 w-full">
                     <button 
                       onClick={handleRegenerateCodes}
                       disabled={loading}
                       className="px-6 py-3 bg-bg-secondary hover:bg-bg-hover text-text-primary text-sm font-semibold rounded-xl outline-none transition-colors w-full border border-border flex items-center justify-center gap-2"
                     >
                       Regenerate Recovery Codes
                     </button>
                     <button 
                       disabled={true} 
                       className="px-6 py-2 bg-transparent text-red-400 opacity-50 cursor-not-allowed text-xs font-bold rounded-xl outline-none transition-colors w-full"
                     >
                       Disable MFA (Coming Soon)
                     </button>
                   </div>
                </div>

              ) : (

                /* MFA is NOT enabled */
                <div className="space-y-6">
                  {!mfaSetupData ? (
                    <div className="flex flex-col items-center bg-bg-panel border border-border rounded-3xl p-8 text-center shadow-sm">
                      <div className="w-16 h-16 bg-accent/10 text-accent-light rounded-full flex items-center justify-center mb-4 ring-8 ring-accent/5">
                        <Key className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-2">Two-Step Verification</h3>
                      <p className="text-[13px] text-text-muted leading-relaxed mb-6">
                        For extra security, require a 6-digit code from an authenticator app when you log in.
                      </p>
                      <button 
                        onClick={initMfaSetup}
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-accent hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center"
                      >
                        {loading ? 'Initializing...' : 'Turn On'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col bg-bg-panel border border-border rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-accent-light" />
                        Set Up Authenticator
                      </h3>
                      
                      <div className="bg-bg-primary rounded-xl p-4 flex flex-col items-center mb-5 border border-border/50">
                        <img src={mfaSetupData.qrCodeDataUrl} alt="MFA QR Code" className="w-40 h-40 rounded-lg mb-4 opacity-90 shadow-sm" />
                        <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-semibold">Or enter this key manually</p>
                        <code className="bg-bg-secondary px-3 py-1.5 rounded-lg text-sm text-accent-light font-mono font-bold tracking-widest break-all text-center select-all">
                          {mfaSetupData.manualEntryKey}
                        </code>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-semibold text-text-secondary">Verify with 6-digit code</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            maxLength={6}
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted text-center tracking-[1em] font-mono text-lg focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200"
                          />
                        </div>

                        {mfaError && (
                          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {mfaError}
                          </div>
                        )}

                        <button 
                          onClick={verifyAndEnableMfa}
                          disabled={loading || mfaToken.length < 6}
                          className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-accent hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          {loading ? 'Verifying...' : 'Verify & Enable'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
