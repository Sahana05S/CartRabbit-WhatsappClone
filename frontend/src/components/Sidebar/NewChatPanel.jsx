import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Loader2,
  Camera,
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatTime';

const NewChatPanel = ({ onClose, onSelectContact }) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1); // 1: Contact selection, 2: Group details
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupInfo, setGroupInfo] = useState({ name: '', description: '' });
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/users');
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to fetch contact list', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const resolveAvatar = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  };

  const filteredUsers = users.filter(u => {
    const searchLow = searchQuery.toLowerCase();
    return (u.displayName || u.username).toLowerCase().includes(searchLow);
  });

  const toggleParticipant = (user) => {
    if (selectedParticipants.find(p => p._id === user._id)) {
      setSelectedParticipants(prev => prev.filter(p => p._id !== user._id));
    } else {
      setSelectedParticipants(prev => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupInfo.name) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', groupInfo.name);
      formData.append('description', groupInfo.description);
      formData.append('members', JSON.stringify(selectedParticipants.map(p => p._id)));
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSelectContact(data.group);
      onClose();
    } catch (err) {
      console.error('Group creation failed', err);
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

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
      <header className="h-[108px] bg-bg-secondary flex items-end px-6 pb-5 gap-6 border-b border-border shrink-0">
        <button onClick={step === 2 ? () => setStep(1) : onClose} className="btn-ghost -ml-2 mb-0.5">
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h2 className="text-[19px] font-bold text-text-primary tracking-tight">
          {step === 1 ? (isGroupMode ? 'Add group participants' : 'New Chat') : 'New Group Details'}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-custom bg-dark-bg/30 flex flex-col">
        {step === 1 ? (
          <>
            {/* Search Bar */}
            <div className="p-3 shrink-0 bg-bg-primary">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Search contacts"
                  className="w-full bg-bg-panel border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-text-primary focus:ring-1 focus:ring-accent outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Selected Participants Chips (for Group Creation) */}
            <AnimatePresence>
              {selectedParticipants.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-3 pt-1 flex flex-wrap gap-2 shrink-0 border-b border-border bg-bg-primary"
                >
                  {selectedParticipants.map(user => (
                    <motion.div 
                      key={user._id}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 bg-accent/20 text-accent text-xs font-bold px-2 py-1 rounded-full border border-accent/30"
                    >
                      <span className="truncate max-w-[120px]">{user.displayName || user.username}</span>
                      <button onClick={() => toggleParticipant(user)} className="hover:text-accent-light transition-colors p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="flex-1">
              {/* New Group Option */}
              {!searchQuery && selectedParticipants.length === 0 && !isGroupMode && (
                <button 
                  onClick={() => setIsGroupMode(true)}
                  className="w-full flex items-center gap-4 px-6 py-4 border-b border-border bg-bg-panel hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-text-primary font-medium block">Create New Group</span>
                    <span className="text-[11px] text-accent/60 font-bold uppercase tracking-wider">Select contacts to begin</span>
                  </div>
                </button>
              )}

              {loading ? (
                <div className="flex justify-center p-10">
                  <Loader2 className="w-8 h-8 text-primary animate-spin opacity-50" />
                </div>
              ) : (
                <div className="py-2 bg-bg-primary">
                  <p className="px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-accent/60">Contacts</p>
                  {filteredUsers.map(user => {
                    const isSelected = selectedParticipants.find(p => p._id === user._id);
                    return (
                      <div 
                        key={user._id}
                        onClick={() => {
                          if (isGroupMode) {
                            toggleParticipant(user);
                          } else {
                            onSelectContact(user);
                            onClose();
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setIsGroupMode(true);
                          toggleParticipant(user);
                        }}
                        className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-all hover:bg-bg-hover relative group ${isSelected ? 'bg-bg-hover' : ''}`}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border border-border overflow-hidden bg-accent/10 flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={resolveAvatar(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-bold text-accent">{getInitials(user.displayName || user.username)}</span>
                            )}
                          </div>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center border-2 border-bg-panel shadow-lg"
                              >
                                <Check className="w-3 h-3 font-bold" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex-1 border-b border-border pb-3 group-last:border-none">
                          <h3 className="text-[16px] font-medium text-text-primary">{user.displayName || user.username}</h3>
                          <p className="text-[12px] text-text-muted truncate">
                            {user.bio || 'Hey there! I am using NexTalk.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Floating Action Button for Group Mode */}
            <AnimatePresence>
              {selectedParticipants.length > 0 && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setStep(2)}
                  className="absolute bottom-8 right-8 w-14 h-14 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20 ring-4 ring-accent/20"
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="p-8 flex flex-col gap-8 animate-fade-in">
            {/* Avatar Selection Placeholder */}
            <div className="flex flex-col items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full bg-bg-panel border-4 border-border flex flex-col items-center justify-center text-text-muted hover:text-accent hover:border-accent transition-all cursor-pointer group shadow-xl relative overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Group Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add Photo</span>
                  </>
                )}
                {avatarPreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Group Name */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                <Users className="w-4 h-4" /> Group Name
              </label>
              <input 
                type="text" 
                placeholder="Give your group a name"
                className="w-full bg-transparent border-b-2 border-border focus:border-accent transition-colors text-xl py-2 px-1 text-text-primary outline-none"
                value={groupInfo.name}
                onChange={(e) => setGroupInfo({ ...groupInfo, name: e.target.value })}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                <Info className="w-4 h-4" /> Description (Optional)
              </label>
              <textarea 
                placeholder="What is this group about?"
                className="w-full bg-transparent border-b-2 border-border focus:border-accent transition-colors min-h-[100px] py-2 px-1 text-text-primary outline-none resize-none"
                value={groupInfo.description}
                onChange={(e) => setGroupInfo({ ...groupInfo, description: e.target.value })}
              />
            </div>

            <div className="flex-1" />

            <button 
              onClick={handleCreateGroup}
              disabled={loading || !groupInfo.name}
              className="bg-accent text-white w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-accent-dark transition-all shadow-lg shadow-accent/20"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Check className="w-6 h-6" /> Create Group
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NewChatPanel;
