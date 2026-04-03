import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Check, 
  Edit2, 
  User, 
  Info,
  CheckCircle2
} from 'lucide-react';

const ProfilePanel = ({ onClose }) => {
  const [displayName, setDisplayName] = useState('Manus AI');
  const [bio, setBio] = useState('Available');
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);

  const handleSaveName = () => {
    // Logic: updateProfile({ displayName })
    setEditingName(false);
  };

  const handleSaveBio = () => {
    // Logic: updateProfile({ bio })
    setEditingBio(false);
  };

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
            onClick={onClose}
            className="btn-ghost hover:bg-glass-heavy text-[#e9edef]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-[#e9edef]">Profile</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-custom bg-dark-bg/30">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-8">
          <div className="relative group cursor-pointer">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-glass-border shadow-2xl relative">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Manus" 
                alt="Profile" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-10 h-10 text-white mb-2" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Change Profile Photo</span>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 bg-primary p-2.5 rounded-full shadow-xl border-4 border-dark-sidebar group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Info Sections */}
        <div className="px-8 space-y-8 pb-10">
          {/* Name Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Your Name
            </label>
            <div className="relative group">
              {!editingName ? (
                <div className="flex items-center justify-between py-2 group-hover:bg-glass/10 rounded-lg px-2 -mx-2 transition-all">
                  <span className="text-lg text-[#e9edef] font-medium">{displayName}</span>
                  <button onClick={() => setEditingName(true)} className="btn-ghost opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-b-2 border-primary pb-1">
                  <input 
                    type="text"
                    autoFocus
                    className="bg-transparent border-none outline-none text-lg text-[#e9edef] w-full py-1"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} className="text-primary hover:scale-110 transition-transform">
                    <Check className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-[#aebac1] leading-relaxed">
              This is not your username or pin. This name will be visible to your NexTalk contacts.
            </p>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary uppercase tracking-widest flex items-center gap-2">
              <Info className="w-4 h-4" /> About
            </label>
            <div className="relative group">
              {!editingBio ? (
                <div className="flex items-center justify-between py-2 group-hover:bg-glass/10 rounded-lg px-2 -mx-2 transition-all">
                  <span className="text-[#e9edef]">{bio}</span>
                  <button onClick={() => setEditingBio(true)} className="btn-ghost opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-b-2 border-primary pb-1">
                  <input 
                    type="text"
                    autoFocus
                    className="bg-transparent border-none outline-none text-[#e9edef] w-full py-1"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBio()}
                  />
                  <button onClick={handleSaveBio} className="text-primary hover:scale-110 transition-transform">
                    <Check className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Verification Badge (Visual Polish) */}
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border-primary/20 bg-primary/5">
            <div className="p-2 bg-primary/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Verified Account</h4>
              <p className="text-xs text-[#aebac1]">Your account is fully secured and verified.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePanel;
