import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Check, 
  Pencil, 
  X, 
  Loader2,
  User,
  ShieldCheck,
  Mail,
  Info,
  Link as LinkIcon,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatTime';
import api from '../../api/axios';

const ProfilePanel = ({ onClose }) => {
  const { currentUser, updateUser } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempName, setTempName] = useState(currentUser?.displayName || currentUser?.username || '');
  const [tempBio, setTempBio] = useState(currentUser?.bio || '');
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const handleUpdateProfile = async (field) => {
    try {
      setLoading(true);
      const payload = {};
      if (field === 'name') payload.displayName = tempName;
      if (field === 'bio') payload.bio = tempBio;
      
      const { data } = await api.patch('/users/profile', payload);
      updateUser(data.user);
      setIsEditingName(false);
      setIsEditingBio(false);
    } catch (err) {
      console.error('Update profile failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/invite/${currentUser?.username}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.user);
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="sidebar-panel border-r border-border bg-bg-primary"
    >
      {/* Header */}
      <header className="h-[108px] bg-bg-secondary flex items-end px-6 pb-5 gap-6 border-b border-border">
        <button onClick={onClose} className="btn-ghost -ml-2 mb-0.5">
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-[19px] font-bold text-text-primary tracking-tight">Profile</h2>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom bg-bg-primary">
        
        {/* Avatar Section */}
        <div className="py-10 flex flex-col items-center justify-center relative bg-ambient-gradient">
          <div className="relative group">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="w-[180px] h-[180px] rounded-full overflow-hidden flex items-center justify-center text-5xl font-bold text-white shadow-2xl border-[6px] border-bg-panel ring-2 ring-accent/20 relative z-10"
              style={{ backgroundColor: currentUser?.avatarColor || 'var(--accent-default)' }}
            >
              {currentUser?.avatarUrl ? (
                <img src={resolveAvatar(currentUser.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(currentUser?.username)
              )}
            </motion.div>
            
            {/* Overlay for hover */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm rounded-full flex flex-col items-center justify-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 border-4 border-transparent"
            >
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-4">Change Photo</span>
            </button>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarSelect}
            />
            
            {loading && (
              <div className="absolute inset-0 bg-bg-panel/60 rounded-full flex items-center justify-center backdrop-blur-md z-30">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold text-text-primary">{currentUser?.username}</h3>
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mt-1">Full Access Member</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6 p-6">
          {/* Name Section */}
          <div className="bg-bg-panel rounded-2xl p-5 border-l-4 border-l-accent shadow-sm">
            <label className="text-[13px] text-accent font-bold uppercase tracking-wider block mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Display Name
            </label>
            <div className="flex items-center justify-between gap-4">
              {isEditingName ? (
                <div className="flex-1 flex flex-col gap-3">
                  <input 
                    autoFocus
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-bg-secondary border-b-2 border-accent text-text-primary text-[16px] py-2 px-3 outline-none rounded-t-lg"
                    placeholder="Enter display name"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditingName(false); setTempName(currentUser?.displayName || currentUser?.username); }} className="btn-ghost text-red-400 p-2"><X className="w-5 h-5"/></button>
                    <button onClick={() => handleUpdateProfile('name')} className="btn-ghost text-primary p-2"><Check className="w-5 h-5"/></button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-[16px] text-text-primary font-medium flex-1 truncate">
                    {currentUser?.displayName || currentUser?.username}
                  </span>
                  <button onClick={() => setIsEditingName(true)} className="btn-ghost text-text-muted hover:text-accent">
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-[12px] text-text-muted mt-4 leading-relaxed italic opacity-80">
              This name will be visible to your NexTalk contacts.
            </p>
          </div>

          {/* Bio Section */}
          <div className="bg-bg-panel rounded-2xl p-5 border-l-4 border-l-accent shadow-sm">
            <label className="text-[13px] text-accent font-bold uppercase tracking-wider block mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Status / About
            </label>
            <div className="flex items-center justify-between gap-4">
              {isEditingBio ? (
                <div className="flex-1 flex flex-col gap-3">
                  <textarea 
                    autoFocus
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="bg-bg-secondary border-b-2 border-accent text-text-primary text-[16px] py-2 px-3 outline-none rounded-t-lg resize-none min-h-[80px]"
                    placeholder="Tell us about yourself"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditingBio(false); setTempBio(currentUser?.bio || ''); }} className="btn-ghost text-red-400 p-2"><X className="w-5 h-5"/></button>
                    <button onClick={() => handleUpdateProfile('bio')} className="btn-ghost text-accent p-2"><Check className="w-5 h-5"/></button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-[16px] text-text-primary font-medium flex-1 break-words">
                    {currentUser?.bio || 'Hey there! I am using NexTalk.'}
                  </span>
                  <button onClick={() => setIsEditingBio(true)} className="btn-ghost text-text-muted hover:text-accent">
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* MFA / Account Section (Read-only for now) */}
          <div className="bg-bg-panel rounded-2xl p-5 opacity-80 mb-10 shadow-sm border border-border">
            <label className="text-[13px] text-text-muted font-bold uppercase tracking-wider block mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Security
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent" />
                <span className="text-sm text-text-primary truncate max-w-[200px]">{currentUser?.email}</span>
              </div>
              <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">Verified</span>
            </div>
          </div>

          {/* Invite Link Section */}
          <div className="bg-gradient-to-br from-accent/10 to-primary/5 rounded-2xl p-5 border border-accent/20 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[80px] blur-xl group-hover:scale-150 transition-transform duration-700" />
            
            <label className="text-[13px] text-accent font-black uppercase tracking-[0.2em] block mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Share My NexTalk Link
            </label>
            
            <div className="flex flex-col gap-3">
              <div className="bg-bg-panel/50 backdrop-blur-sm border border-border rounded-xl p-3 flex items-center justify-between gap-3 group/link">
                <span className="text-xs text-text-secondary truncate font-medium">
                  {window.location.origin}/invite/{currentUser?.username}
                </span>
                <button 
                  onClick={handleCopyLink}
                  className={`shrink-0 p-2 rounded-lg transition-all ${
                    copied ? 'bg-green-500 text-white' : 'bg-accent/10 text-accent hover:bg-accent hover:text-white'
                  }`}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest pl-1">
                Anyone with this link can connect with you instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePanel;
