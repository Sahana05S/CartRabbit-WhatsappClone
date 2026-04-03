import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Search, 
  Paperclip, 
  Smile, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  File, 
  User, 
  Video, 
  ArrowLeft,
  LayoutGrid,
  Check,
  CheckCheck,
  ChevronDown,
  X,
  Maximize2
} from 'lucide-react';

const MainChat = ({ activeChat, onBack }) => {
  const [message, setMessage] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const scrollRef = useRef(null);

  // Mock chat data - would come from ChatContext
  const chatInfo = {
    id: activeChat,
    name: activeChat === 1 ? 'Alice Cooper' : 'Project Alpha',
    type: activeChat === 1 ? 'individual' : 'group',
    status: activeChat === 1 ? 'Online' : 'Alice, Bob, Charlie...',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChat === 1 ? 'Alice' : 'Alpha'}`,
    wallpaper: 'https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'
  };

  const messages = [
    { id: 1, sender: 'them', text: 'Hey! Did you see the new design for NexTalk?', time: '10:15 AM', status: 'read' },
    { id: 2, sender: 'me', text: 'Not yet, let me check. Is it the glassmorphic one?', time: '10:16 AM', status: 'read' },
    { id: 3, sender: 'them', text: 'Yes! It looks amazing. Check this out.', time: '10:17 AM', status: 'read' },
    { id: 4, sender: 'them', type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60', time: '10:17 AM', status: 'read' },
    { id: 5, sender: 'me', text: 'Wow, that is stunning! The transitions are so smooth.', time: '10:20 AM', status: 'delivered' },
    { id: 6, sender: 'them', text: 'Exactly. We should implement it ASAP.', time: '10:21 AM', status: 'read' },
    { id: 7, sender: 'me', text: 'I am on it. Working on the React components now.', time: '10:24 AM', status: 'sent' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setScrolledUp(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'sent': return <Check className="w-3.5 h-3.5 text-[#aebac1]" />;
      case 'delivered': return <CheckCheck className="w-3.5 h-3.5 text-[#aebac1]" />;
      case 'read': return <CheckCheck className="w-3.5 h-3.5 text-accent" />;
      default: return null;
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-chat relative overflow-hidden">
        <div className="absolute inset-0 bg-chat-pattern opacity-[0.03] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 p-8"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <Send className="w-10 h-10 text-primary rotate-12" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">NexTalk for Web</h2>
          <p className="text-[#aebac1] max-w-md mx-auto leading-relaxed">
            Send and receive messages without keeping your phone online. Use NexTalk on up to 4 linked devices and 1 phone at the same time.
          </p>
          <div className="mt-12 flex items-center justify-center gap-2 text-[#aebac1] text-sm">
            <Lock className="w-4 h-4" />
            <span>End-to-end encrypted</span>
          </div>
        </motion.div>
        <div className="absolute bottom-10 w-full text-center">
          <div className="h-1 w-32 bg-primary/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary w-1/3 animate-[loading_2s_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden bg-dark-chat relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10 border-r border-glass-border/30">
        {/* Chat Header */}
        <header className="h-[60px] flex items-center justify-between px-4 bg-dark-panel/90 backdrop-blur-md border-b border-glass-border/30 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="md:hidden btn-ghost">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative cursor-pointer group">
              <img src={chatInfo.avatar} alt={chatInfo.name} className="w-10 h-10 rounded-full border border-glass-border" />
              {chatInfo.status === 'Online' && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-dark-panel rounded-full" />
              )}
            </div>
            <div className="flex flex-col cursor-pointer">
              <h3 className="text-[16px] font-semibold text-white leading-tight">{chatInfo.name}</h3>
              <span className="text-[12px] text-[#aebac1] font-medium">{chatInfo.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="btn-ghost" title="Search in chat">
              <Search className="w-5 h-5" />
            </button>
            <button 
              className={`btn-ghost ${showGallery ? 'text-primary bg-primary/10' : ''}`} 
              onClick={() => setShowGallery(!showGallery)}
              title="Media Gallery"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button className="btn-ghost">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message List */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-custom p-4 md:p-6 space-y-4 relative"
          style={{ backgroundImage: `url(${chatInfo.wallpaper})`, backgroundBlendMode: 'overlay', backgroundColor: 'rgba(11, 20, 26, 0.95)' }}
        >
          {/* Date Divider */}
          <div className="flex justify-center my-6">
            <span className="bg-dark-panel/80 backdrop-blur-md text-[#aebac1] text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border border-glass-border shadow-sm">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] md:max-w-[60%] group relative ${msg.sender === 'me' ? 'chat-bubble-me' : 'chat-bubble-them'}`}>
                {msg.type === 'image' ? (
                  <div className="relative rounded-lg overflow-hidden mb-1 cursor-pointer">
                    <img src={msg.url} alt="Shared" className="w-full h-auto max-h-80 object-cover" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white/70" />
                    </div>
                  </div>
                ) : (
                  <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap pr-12">
                    {msg.text}
                  </p>
                )}
                
                <div className={`absolute bottom-1 right-2 flex items-center gap-1.5 ${msg.type === 'image' ? 'bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm' : ''}`}>
                  <span className={`text-[10px] font-medium ${msg.type === 'image' ? 'text-white' : 'text-[#aebac1]'}`}>
                    {msg.time}
                  </span>
                  {msg.sender === 'me' && renderStatus(msg.status)}
                </div>

                {/* Bubble Tail Replacement (Visual Polish) */}
                <div className={`absolute top-0 w-2 h-2 ${msg.sender === 'me' ? '-right-1.5 bg-dark-bubble-me clip-path-tail-right' : '-left-1.5 bg-dark-bubble-them clip-path-tail-left'}`} />
              </div>
            </motion.div>
          ))}

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {scrolledUp && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={scrollToBottom}
                className="fixed bottom-24 right-8 md:right-[calc(30%+2rem)] z-20 w-10 h-10 bg-dark-panel border border-glass-border rounded-full flex items-center justify-center shadow-2xl hover:bg-glass-heavy transition-all"
              >
                <ChevronDown className="w-6 h-6 text-[#aebac1]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-dark-bg text-[10px] font-bold flex items-center justify-center rounded-full">3</div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Message Input Area */}
        <footer className="min-h-[62px] bg-dark-panel/95 backdrop-blur-xl border-t border-glass-border/30 px-4 py-2 flex items-end gap-3 z-20">
          <div className="flex items-center gap-1 pb-1">
            <div className="relative">
              <button 
                className={`btn-ghost ${showEmoji ? 'text-primary' : ''}`}
                onClick={() => setShowEmoji(!showEmoji)}
              >
                <Smile className="w-6 h-6" />
              </button>
              {/* Emoji Picker Mock */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-14 left-0 w-72 h-80 glass-card-heavy rounded-2xl p-4 shadow-2xl z-30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-primary uppercase">Emojis</span>
                      <button onClick={() => setShowEmoji(false)}><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃'].map(e => (
                        <button key={e} className="text-2xl hover:scale-125 transition-transform">{e}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                className={`btn-ghost ${showAttachments ? 'text-primary bg-primary/10 rotate-45' : ''}`}
                onClick={() => setShowAttachments(!showAttachments)}
              >
                <Paperclip className="w-6 h-6 transition-transform" />
              </button>
              
              <AnimatePresence>
                {showAttachments && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowAttachments(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.5 }}
                      className="absolute bottom-14 left-0 flex flex-col gap-3 z-30"
                    >
                      {[
                        { icon: ImageIcon, color: 'bg-purple-500', label: 'Photos' },
                        { icon: Video, color: 'bg-pink-500', label: 'Videos' },
                        { icon: File, color: 'bg-blue-500', label: 'Document' },
                        { icon: User, color: 'bg-cyan-500', label: 'Contact' },
                      ].map((item, i) => (
                        <motion.button 
                          key={item.label}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 group"
                        >
                          <div className={`${item.color} p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform`}>
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="bg-dark-panel px-3 py-1 rounded-lg text-xs font-bold text-white border border-glass-border opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                            {item.label}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 bg-dark-bg/50 rounded-xl border border-glass-border focus-within:border-primary/50 transition-all py-2 px-4 mb-1">
            <textarea 
              rows="1"
              placeholder="Type a message"
              className="w-full bg-transparent border-none outline-none text-[15px] text-[#e9edef] placeholder-[#aebac1] resize-none scrollbar-none max-h-32"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Logic: sendMessage(message)
                  setMessage('');
                }
              }}
            />
          </div>

          <div className="pb-1">
            {message.trim() ? (
              <motion.button 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-dark-bg shadow-lg hover:bg-primary-light transition-all active:scale-90"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </motion.button>
            ) : (
              <button className="btn-ghost">
                <Mic className="w-6 h-6" />
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Media Gallery Sidebar */}
      <AnimatePresence>
        {showGallery && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '30%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden md:flex flex-col bg-dark-sidebar border-l border-glass-border h-full z-20"
          >
            <header className="h-[60px] flex items-center justify-between px-6 bg-dark-panel/50 border-b border-glass-border">
              <h3 className="text-lg font-semibold text-white">Media Gallery</h3>
              <button onClick={() => setShowGallery(false)} className="btn-ghost"><X className="w-5 h-5" /></button>
            </header>
            
            <div className="flex-1 overflow-y-auto scrollbar-custom p-4">
              <div className="flex bg-glass rounded-xl p-1 mb-6">
                {['Media', 'Files', 'Links'].map(tab => (
                  <button key={tab} className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === 'Media' ? 'bg-primary text-dark-bg' : 'text-[#aebac1] hover:text-white'}`}>
                    {tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-dark-panel border border-glass-border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group">
                    <img 
                      src={`https://picsum.photos/seed/${i + activeChat * 10}/200`} 
                      alt="Media" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainChat;
