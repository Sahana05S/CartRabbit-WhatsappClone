import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  UserPlus, 
  ChevronRight, 
  Check, 
  Camera,
  X,
  ArrowRight
} from 'lucide-react';

const NewChatPanel = ({ onClose, onSelectContact }) => {
  const [step, setStep] = useState('contacts'); // 'contacts', 'group-members', 'group-details'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState('');

  // Mock contacts - would come from ChatContext
  const contacts = [
    { id: 101, name: 'Alice Cooper', status: 'Hey there! I am using NexTalk.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { id: 102, name: 'Bob Smith', status: 'At the gym 🏋️‍♂️', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    { id: 103, name: 'Charlie Brown', status: 'Busy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
    { id: 104, name: 'David Wilson', status: 'Available', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 105, name: 'Eva Green', status: 'In a meeting', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva' },
  ];

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContactSelection = (contact) => {
    if (selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleCreateGroup = () => {
    // Logic: createGroup({ name: groupName, participants: selectedContacts.map(c => c.id) })
    console.log('Creating group:', groupName, 'with', selectedContacts.length, 'members');
    onClose();
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
            onClick={step === 'contacts' ? onClose : () => setStep(step === 'group-details' ? 'group-members' : 'contacts')}
            className="btn-ghost hover:bg-glass-heavy text-[#e9edef]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-[#e9edef]">
            {step === 'contacts' ? 'New Chat' : step === 'group-members' ? 'Add Group Members' : 'New Group'}
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-custom bg-dark-bg/30">
        <AnimatePresence mode="wait">
          {step === 'contacts' && (
            <motion.div 
              key="contacts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="px-4 py-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aebac1]" />
                  <input 
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full bg-dark-panel border-none rounded-lg py-2 pl-10 pr-4 text-sm text-[#e9edef] placeholder-[#aebac1] focus:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <button 
                  onClick={() => setStep('group-members')}
                  className="w-full flex items-center gap-4 px-6 py-3 hover:bg-glass transition-all group"
                >
                  <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[#e9edef] font-medium">New Group</span>
                </button>
                <button className="w-full flex items-center gap-4 px-6 py-3 hover:bg-glass transition-all group">
                  <div className="p-3 rounded-full bg-accent/20 text-accent group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <span className="text-[#e9edef] font-medium">New Contact</span>
                </button>
              </div>

              <div className="px-6 py-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Contacts on NexTalk</h3>
                <div className="space-y-2">
                  {filteredContacts.map(contact => (
                    <button 
                      key={contact.id}
                      onClick={() => onSelectContact(contact.id)}
                      className="w-full flex items-center gap-4 py-2 hover:bg-glass/10 rounded-xl px-2 -mx-2 transition-all group"
                    >
                      <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full border border-glass-border group-hover:scale-105 transition-transform" />
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="text-[#e9edef] font-medium truncate">{contact.name}</h4>
                        <p className="text-xs text-[#aebac1] truncate">{contact.status}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'group-members' && (
            <motion.div 
              key="group-members"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Selected Chips */}
              {selectedContacts.length > 0 && (
                <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-glass-border">
                  {selectedContacts.map(contact => (
                    <div key={contact.id} className="flex items-center gap-1.5 bg-glass-heavy px-2 py-1 rounded-full border border-glass-border animate-fade-in">
                      <img src={contact.avatar} className="w-5 h-5 rounded-full" />
                      <span className="text-xs text-white">{contact.name}</span>
                      <button onClick={() => toggleContactSelection(contact)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aebac1]" />
                  <input 
                    type="text"
                    placeholder="Search to add members..."
                    className="w-full bg-dark-panel border-none rounded-lg py-2 pl-10 pr-4 text-sm text-[#e9edef] placeholder-[#aebac1] focus:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="px-6 py-2">
                {filteredContacts.map(contact => (
                  <button 
                    key={contact.id}
                    onClick={() => toggleContactSelection(contact)}
                    className="w-full flex items-center gap-4 py-3 border-b border-glass-border/10 last:border-none group"
                  >
                    <div className="relative">
                      <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full border border-glass-border" />
                      {selectedContacts.find(c => c.id === contact.id) && (
                        <div className="absolute -bottom-1 -right-1 bg-primary p-1 rounded-full border-2 border-dark-sidebar animate-scale-in">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="text-[#e9edef] font-medium truncate">{contact.name}</h4>
                      <p className="text-xs text-[#aebac1] truncate">{contact.status}</p>
                    </div>
                  </button>
                ))}
              </div>

              {selectedContacts.length > 0 && (
                <div className="absolute bottom-8 right-8 animate-bounce-in">
                  <button 
                    onClick={() => setStep('group-details')}
                    className="w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
                  >
                    <ArrowRight className="w-7 h-7" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'group-details' && (
            <motion.div 
              key="group-details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8"
            >
              <div className="flex flex-col items-center gap-8">
                <div className="relative group cursor-pointer">
                  <div className="w-40 h-40 rounded-full bg-dark-panel border-4 border-glass-border flex items-center justify-center overflow-hidden shadow-2xl">
                    <Camera className="w-12 h-12 text-[#aebac1] group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-white uppercase">Upload Group Photo</span>
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest ml-1">Group Name</label>
                  <input 
                    type="text"
                    placeholder="Enter group name..."
                    autoFocus
                    className="glass-input w-full text-lg py-3"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>

                <div className="w-full bg-dark-panel/50 rounded-2xl p-4 border border-glass-border">
                  <h4 className="text-xs font-bold text-[#aebac1] uppercase tracking-widest mb-3">Participants: {selectedContacts.length}</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedContacts.map(contact => (
                      <div key={contact.id} className="flex flex-col items-center gap-1 w-16">
                        <img src={contact.avatar} className="w-10 h-10 rounded-full border border-glass-border" />
                        <span className="text-[10px] text-[#aebac1] truncate w-full text-center">{contact.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                  className="btn-primary w-full py-4 text-lg font-bold shadow-2xl flex items-center justify-center gap-3"
                >
                  <Check className="w-6 h-6" /> Create Group
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default NewChatPanel;
