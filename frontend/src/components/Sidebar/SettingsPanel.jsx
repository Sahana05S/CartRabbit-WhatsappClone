import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Shield, 
  Bell, 
  MessageSquare, 
  Monitor, 
  Sun, 
  Moon, 
  Volume2, 
  Globe, 
  Command, 
  Eye, 
  CheckCircle2, 
  Upload, 
  Lock, 
  Key, 
  Copy, 
  AlertTriangle,
  Download,
  Palette,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';

const SettingsPanel = ({ onClose }) => {
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
    { id: 'none', name: 'Default', type: 'none', value: '', previewClass: 'bg-dark-bg' },
    { id: 'doodle-light', name: 'Doodle', type: 'preset', value: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', previewClass: 'bg-primary/20' },
    { id: 'grad-teal', name: 'Teal', type: 'preset', value: 'linear-gradient(to right bottom, #11998e, #38ef7d)', previewClass: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d]' },
    { id: 'grad-blue', name: 'Ocean', type: 'preset', value: 'linear-gradient(to right bottom, #2193b0, #6dd5ed)', previewClass: 'bg-gradient-to-br from-[#2193b0] to-[#6dd5ed]' },
    { id: 'color-dark', name: 'Dark', type: 'color', value: '#0b141a', previewClass: 'bg-[#0b141a]' },
    { id: 'color-slate', name: 'Slate', type: 'color', value: '#1e293b', previewClass: 'bg-slate-800' },
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
    if (!window.confirm("Are you sure? This will invalidate all your existing recovery codes!")) return;
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
    const content = `NexTalk Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\n${mfaRecoveryCodes.join('\n')}\n\nKeep these secure.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nextalk-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'privacy', label: 'Privacy', icon: Shield, color: 'text-primary' },
    { id: 'security', label: 'Security', icon: Lock, color: 'text-accent' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-400' },
    { id: 'chat', label: 'Chat Settings', icon: MessageSquare, color: 'text-emerald-400' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'text-purple-400' }
  ];

  const panelVariants = {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' }
  };

  return (
    <motion.div 
      variants={panelVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="sidebar-panel border-r border-border bg-bg-primary"
    >
      <header className="h-[108px] bg-bg-secondary flex items-end px-6 pb-5 gap-6 border-b border-border">
        <button onClick={activeCategory ? () => {
          setActiveCategory(null);
          setMfaSetupData(null);
          setMfaRecoveryCodes(null);
          setMfaError('');
        } : onClose} className="btn-ghost -ml-2 mb-0.5">
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-[19px] font-bold text-text-primary tracking-tight">
          {activeCategory ? categories.find(c => c.id === activeCategory).label : 'Settings'}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-custom bg-bg-primary">
        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-2"
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-bg-hover transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl bg-bg-panel border border-border shadow-inner ${cat.color}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-semibold text-text-primary">{cat.label}</p>
                      <p className="text-[12px] text-text-muted opacity-60">Manage your {cat.label.toLowerCase()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="category"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-6"
            >
              {activeCategory === 'privacy' && (
                <>
                  <SettingToggle 
                    label="Last Seen" 
                    desc="Show your last seen status to others" 
                    icon={Eye}
                    checked={settings.privacy.lastSeen} 
                    onToggle={() => toggleSetting('privacy', 'lastSeen')} 
                    disabled={loading}
                    activeColor="bg-primary"
                  />
                  <SettingToggle 
                    label="Online Status" 
                    desc="Show when you are currently online" 
                    icon={Globe}
                    checked={settings.privacy.onlineStatus} 
                    onToggle={() => toggleSetting('privacy', 'onlineStatus')} 
                    disabled={loading}
                    activeColor="bg-primary"
                  />
                  <SettingToggle 
                    label="Read Receipts" 
                    desc="Display blue ticks when messages read" 
                    icon={CheckCircle2}
                    checked={settings.privacy.readReceipts} 
                    onToggle={() => toggleSetting('privacy', 'readReceipts')} 
                    disabled={loading}
                    activeColor="bg-primary"
                  />
                </>
              )}

              {activeCategory === 'security' && (
                <div className="space-y-6">
                  {mfaRecoveryCodes ? (
                    <div className="bg-bg-panel rounded-2xl p-5 border border-accent/20">
                      <div className="flex items-center gap-3 mb-4 text-accent">
                        <Shield className="w-6 h-6" />
                        <h3 className="font-bold">MFA Enabled Successfully</h3>
                      </div>
                      <p className="text-xs text-text-muted mb-4">
                        Save these recovery codes securely. They will only be shown once.
                      </p>
                      <div className="grid grid-cols-2 gap-2 bg-bg-secondary p-4 rounded-xl font-mono text-xs text-text-primary">
                        {mfaRecoveryCodes.map((code, idx) => (
                          <div key={idx} className="tracking-widest">{code}</div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { navigator.clipboard.writeText(mfaRecoveryCodes.join('\n')); alert('Copied!'); }} className="flex-1 btn-ghost text-xs border border-border">Copy</button>
                        <button onClick={handleDownloadCodes} className="flex-1 btn-ghost text-xs border border-border">Save</button>
                      </div>
                    </div>
                  ) : currentUser.mfaEnabled ? (
                    <div className="bg-bg-panel rounded-2xl p-8 text-center border-t-4 border-t-accent shadow-sm">
                      <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mb-2">Security Shield Active</h3>
                      <p className="text-sm text-text-muted mb-6">MFA protection is active on your account.</p>
                      <button onClick={handleRegenerateCodes} disabled={loading} className="w-full btn-ghost border border-border text-sm py-3">Regenerate Codes</button>
                    </div>
                  ) : (
                    <div className="bg-bg-panel rounded-2xl p-8 text-center border-t-4 border-t-accent shadow-sm">
                      {!mfaSetupData ? (
                        <>
                          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-2">Two-Step Verification</h3>
                          <p className="text-sm text-text-muted mb-6">Add an extra layer of security to your account.</p>
                          <button onClick={initMfaSetup} disabled={loading} className="w-full btn-primary py-3">Enable MFA</button>
                        </>
                      ) : (
                        <div className="text-left space-y-6">
                          <div className="bg-white p-3 rounded-xl mx-auto w-fit">
                            <img src={mfaSetupData.qrCodeDataUrl} alt="QR" className="w-32 h-32" />
                          </div>
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-accent uppercase tracking-widest">Verify with App</label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={mfaToken}
                              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g,''))}
                              className="w-full bg-bg-secondary border border-border rounded-xl text-center text-2xl tracking-[0.8em] py-2 outline-none focus:border-accent transition-all text-text-primary"
                              placeholder="000000"
                            />
                            {mfaError && <p className="text-red-400 text-xs text-center">{mfaError}</p>}
                            <button onClick={verifyAndEnableMfa} disabled={loading || mfaToken.length < 6} className="w-full btn-primary py-3">Enable MFA</button>
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
                    activeColor="bg-yellow-400"
                  />
                  <SettingToggle 
                    label="Desktop Notifications" 
                    desc="Browser alerts when in background" 
                    icon={Monitor}
                    checked={settings.notifications.desktop} 
                    onToggle={() => toggleSetting('notifications', 'desktop')} 
                    disabled={loading}
                    activeColor="bg-yellow-400"
                  />
                </>
              )}

              {activeCategory === 'appearance' && (
                <div className="space-y-8">
                  <div className="bg-bg-panel border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      {theme === 'dark' ? <Moon className="w-6 h-6 text-accent" /> : <Sun className="w-6 h-6 text-yellow-500" />}
                      <div>
                        <p className="text-sm font-bold text-text-primary">Theme Mode</p>
                        <p className="text-xs text-text-muted">Switch light/dark mode</p>
                      </div>
                    </div>
                    <button onClick={toggleTheme} className="btn-ghost border border-border px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all text-text-primary">
                      {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest block px-2">Chat Wallpaper</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[9/16] rounded-xl bg-bg-panel border border-border flex flex-col items-center justify-center gap-2 hover:border-accent transition-all group shadow-sm"
                      >
                        <Upload className="w-6 h-6 text-text-muted group-hover:text-accent" />
                        <span className="text-[10px] text-text-muted">Custom</span>
                        <input ref={fileInputRef} type="file" onChange={handleCustomUpload} className="hidden" accept="image/*" />
                      </button>
                      {WALLPAPER_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => updateSetting('appearance', 'chatWallpaper', { type: preset.type, value: preset.value })}
                          className={`aspect-[9/16] rounded-xl border-2 transition-all relative overflow-hidden ${preset.previewClass} ${currentWallpaper.value === preset.value ? 'border-primary scale-95 shadow-lg' : 'border-transparent'}`}
                        >
                          {currentWallpaper.value === preset.value && (
                            <div className="absolute top-2 right-2 bg-primary text-dark-bg p-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="p-6 bg-bg-secondary/40 border-t border-border">
        <p className="text-[10px] text-text-muted text-center uppercase tracking-widest font-black opacity-40">NexTalk Settings Engine v2.0</p>
      </footer>
    </motion.div>
  );
};

const SettingToggle = ({ label, desc, icon: Icon, checked, onToggle, disabled, activeColor }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg bg-bg-panel border border-border ${checked ? 'text-accent' : 'text-text-muted'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-[11px] text-text-muted">{desc}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      disabled={disabled}
      className={`w-10 h-6 rounded-full relative transition-all ${checked ? activeColor : 'bg-bg-secondary'} ${disabled ? 'opacity-50' : 'hover:scale-105'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'} shadow-md`} />
    </button>
  </div>
);

export default SettingsPanel;
