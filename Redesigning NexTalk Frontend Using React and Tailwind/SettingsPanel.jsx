import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Palette, 
  Shield, 
  Lock, 
  Bell, 
  HelpCircle, 
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  QrCode,
  Smartphone,
  RefreshCw
} from 'lucide-react';

const SettingsPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'appearance', 'privacy', 'security'
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  const recoveryCodes = [
    'ABCD-1234', 'EFGH-5678', 'IJKL-9012', 'MNOP-3456',
    'QRST-7890', 'UVWX-1234', 'YZAB-5678', 'CDEF-9012'
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="glass-card-heavy p-6 rounded-3xl border-primary/20 bg-primary/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${mfaEnabled ? 'bg-primary/20 text-primary' : 'bg-red-400/20 text-red-400'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-[#aebac1]">
                {mfaEnabled ? 'MFA is currently active' : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${mfaEnabled ? 'bg-primary text-dark-bg' : 'bg-red-400/20 text-red-400 border border-red-400/30'}`}>
            {mfaEnabled ? 'Active' : 'Disabled'}
          </div>
        </div>

        {!mfaEnabled ? (
          <div className="space-y-4">
            <div className="bg-dark-panel/50 p-4 rounded-2xl border border-glass-border">
              <div className="flex items-center gap-3 mb-3">
                <QrCode className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-white">Setup with Authenticator</span>
              </div>
              <div className="bg-white p-2 w-32 h-32 rounded-xl mx-auto mb-4">
                {/* Mock QR Code */}
                <div className="w-full h-full bg-dark-bg rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-white/20" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-[#aebac1] text-center">Scan the QR code or enter the key manually</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    className="glass-input w-full text-center tracking-widest font-mono"
                    maxLength={6}
                  />
                  <button onClick={() => setMfaEnabled(true)} className="btn-primary whitespace-nowrap">Verify</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button 
              onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
              className="w-full flex items-center justify-between p-4 bg-glass rounded-2xl hover:bg-glass-heavy transition-all group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-white">View Recovery Codes</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-[#aebac1] transition-transform ${showRecoveryCodes ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showRecoveryCodes && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-dark-panel p-5 rounded-2xl border border-glass-border space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map(code => (
                        <code key={code} className="bg-dark-bg p-2 rounded text-xs text-accent text-center font-mono border border-accent/10">
                          {code}
                        </code>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="flex-1 btn-ghost bg-glass flex items-center justify-center gap-2 text-xs py-2">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy All'}
                      </button>
                      <button className="flex-1 btn-ghost bg-glass flex items-center justify-center gap-2 text-xs py-2">
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                    <p className="text-[10px] text-red-400 text-center italic">
                      Save these codes in a secure place. They are the only way to recover your account if you lose your MFA device.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => setMfaEnabled(false)}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all text-sm font-bold border border-transparent hover:border-red-400/20"
            >
              <AlertTriangle className="w-4 h-4" /> Disable MFA
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const menuItems = [
    { id: 'appearance', icon: Palette, title: 'Appearance', desc: 'Theme, wallpapers, chat bubbles', color: 'text-pink-400' },
    { id: 'privacy', icon: Eye, title: 'Privacy', desc: 'Last seen, read receipts, blocked', color: 'text-blue-400' },
    { id: 'security', icon: Lock, title: 'Security', desc: 'Two-step verification, recovery', color: 'text-green-400' },
    { id: 'notifications', icon: Bell, title: 'Notifications', desc: 'Message, group & call tones', color: 'text-yellow-400' },
    { id: 'help', icon: HelpCircle, title: 'Help', desc: 'Help center, contact us, privacy policy', color: 'text-purple-400' },
  ];

  return (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="sidebar-panel"
    >
      {/* Header */}
      <header className="h-[108px] flex items-end px-6 pb-4 bg-dark-panel/50 backdrop-blur-lg border-b border-glass-border">
        <div className="flex items-center gap-6">
          <button 
            onClick={activeTab === 'main' ? onClose : () => setActiveTab('main')}
            className="btn-ghost hover:bg-glass-heavy text-[#e9edef]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-[#e9edef]">
            {activeTab === 'main' ? 'Settings' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-custom bg-dark-bg/30">
        <AnimatePresence mode="wait">
          {activeTab === 'main' ? (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-4"
            >
              {menuItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-glass transition-all border-b border-glass-border/10 group"
                >
                  <div className={`p-2.5 rounded-xl bg-glass group-hover:scale-110 transition-transform ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-[#e9edef] font-medium">{item.title}</h3>
                    <p className="text-xs text-[#aebac1]">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#aebac1] group-hover:text-white transition-colors" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6"
            >
              {activeTab === 'security' && renderSecuritySection()}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Chat Wallpaper</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-[9/16] rounded-xl bg-dark-panel border-2 border-glass-border hover:border-primary cursor-pointer transition-all overflow-hidden relative group">
                          <div className={`absolute inset-0 bg-chat-pattern opacity-20 group-hover:opacity-40 transition-opacity`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-[#aebac1] group-hover:text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab !== 'security' && activeTab !== 'appearance' && (
                <div className="flex flex-col items-center justify-center py-20 text-[#aebac1]">
                  <RefreshCw className="w-12 h-12 mb-4 animate-spin-slow opacity-20" />
                  <p>Coming soon in next update</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;
