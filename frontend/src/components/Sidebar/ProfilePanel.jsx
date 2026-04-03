import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Check, Pencil, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatTime';
import api from '../../api/axios';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ProfilePanel({ onClose }) {
  const { currentUser, updateUser } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio,  setIsEditingBio]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [tempName,      setTempName]      = useState(currentUser?.displayName || currentUser?.username || '');
  const [tempBio,       setTempBio]       = useState(currentUser?.bio || '');
  
  const fileInputRef = useRef(null);

  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const handleUpdateProfile = async (field) => {
    try {
      setLoading(true);
      const payload = {};
      if (field === 'name') payload.displayName = tempName;
      if (field === 'bio')  payload.bio         = tempBio;
      
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
    <div className="absolute inset-0 bg-bg-secondary flex flex-col z-30 animate-slide-right">
      {/* Header */}
      <div className="h-[108px] bg-bg-panel border-b border-border flex items-end px-6 pb-4 gap-6 shrink-0 transition-colors">
        <button onClick={onClose} className="p-1 text-text-primary hover:bg-white/5 rounded-full transition-colors mb-0.5">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-[19px] font-semibold text-text-primary">Profile</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Avatar Section */}
        <div className="py-8 flex flex-col items-center gap-4 bg-bg-secondary">
          <div className="relative group">
            <div 
              className="w-[200px] h-[200px] rounded-full overflow-hidden flex items-center justify-center text-5xl font-bold text-white shadow-xl border-4 border-border ring-4 ring-bg-panel ring-offset-bg-secondary"
              style={{ backgroundColor: currentUser?.avatarColor || '#7c3aed' }}
            >
              {currentUser?.avatarUrl ? (
                <img src={resolveAvatar(currentUser.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(currentUser?.username)
              )}
            </div>
            
            {/* Overlay for hover */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
            >
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Change profile photo</span>
            </button>
            
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarSelect}
            />
            
            {loading && (
              <div className="absolute inset-0 bg-bg-panel/50 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 text-accent-light animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Name Section */}
        <div className="px-8 py-5 bg-bg-panel mb-2 transition-colors">
          <label className="text-[14px] text-accent-light font-medium block mb-3">Your name</label>
          <div className="flex items-center justify-between gap-4">
            {isEditingName ? (
              <div className="flex-1 flex flex-col gap-1">
                <input 
                  autoFocus
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile('name')}
                  className="bg-transparent border-b-2 border-accent-light text-text-primary text-[15px] py-1 focus:outline-none"
                  placeholder="Enter display name"
                />
                <div className="flex justify-end gap-2 mt-2">
                   <button onClick={() => { setIsEditingName(false); setTempName(currentUser?.displayName || currentUser?.username); }} className="p-1 hover:bg-white/5 rounded-lg text-red-400"><X className="w-5 h-5"/></button>
                   <button onClick={() => handleUpdateProfile('name')} className="p-1 hover:bg-white/5 rounded-lg text-green-400"><Check className="w-5 h-5"/></button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-[15px] text-text-primary flex-1 truncate">
                  {currentUser?.displayName || currentUser?.username}
                </span>
                <button onClick={() => setIsEditingName(true)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-[13px] text-text-muted mt-3 leading-snug">
            This name will be visible to your NexTalk contacts.
          </p>
        </div>

        {/* Bio Section */}
        <div className="px-8 py-5 bg-bg-panel mb-2 transition-colors">
          <label className="text-[14px] text-accent-light font-medium block mb-3">About</label>
          <div className="flex items-center justify-between gap-4">
            {isEditingBio ? (
              <div className="flex-1 flex flex-col gap-1">
                <textarea 
                  autoFocus
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="bg-transparent border-b-2 border-accent-light text-text-primary text-[15px] py-1 focus:outline-none resize-none min-h-[60px]"
                  placeholder="Tell us about yourself"
                />
                <div className="flex justify-end gap-2 mt-2">
                   <button onClick={() => { setIsEditingBio(false); setTempBio(currentUser?.bio || ''); }} className="p-1 hover:bg-white/5 rounded-lg text-red-400"><X className="w-5 h-5"/></button>
                   <button onClick={() => handleUpdateProfile('bio')} className="p-1 hover:bg-white/5 rounded-lg text-green-400"><Check className="w-5 h-5"/></button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-[15px] text-text-primary flex-1 break-words">
                  {currentUser?.bio || 'Hey there! I am using NexTalk.'}
                </span>
                <button onClick={() => setIsEditingBio(true)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Email Section (Display Only) */}
        <div className="px-8 py-5 bg-bg-panel transition-colors">
          <label className="text-[14px] text-accent-light font-medium block mb-3">Email</label>
          <div className="flex items-center">
            <span className="text-[15px] text-text-primary opacity-60">
              {currentUser?.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
