import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Lock, ShieldCheck, Zap } from 'lucide-react';

const EmptyChatState = () => {
  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-bg-primary relative overflow-hidden p-6 text-center">
      
      {/* Ambient background glows */}
      <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[30%] right-[20%] w-[250px] h-[250px] bg-accent/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-lg flex flex-col items-center"
      >
        {/* Main Brand Icon */}
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-24 h-24 mb-10 glass-card-heavy rounded-3xl flex items-center justify-center border border-glass-border shadow-2xl relative group"
        >
          <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/20 transition-all rounded-3xl" />
          <MessageSquare className="w-10 h-10 text-accent drop-shadow-glow" strokeWidth={1.5} />
        </motion.div>
        
        <h1 className="text-4xl font-black text-text-primary mb-6 tracking-tight">
          NexTalk
        </h1>
        
        <p className="text-text-muted text-base leading-relaxed mb-10 font-medium opacity-80">
          Experience the next generation of real-time communication. 
          Your messages are synchronized across all your devices with 
          military-grade encryption and ultra-low latency.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
          <div className="bg-bg-panel p-4 rounded-2xl flex flex-col items-center gap-2 border border-border shadow-sm">
            <Lock className="w-5 h-5 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Secure</span>
          </div>
          <div className="bg-bg-panel p-4 rounded-2xl flex flex-col items-center gap-2 border border-border shadow-sm">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Fast</span>
          </div>
          <div className="bg-bg-panel p-4 rounded-2xl flex flex-col items-center gap-2 border border-border shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Safe</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-accent/60 uppercase tracking-[0.2em] animate-pulse">
          <Lock className="w-3 h-3" />
          End-to-end encrypted
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-0 right-0 py-4 opacity-20 pointer-events-none">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-text-muted">Authorized Access Only • NexTalk Core Engine v2.0.4</p>
      </div>
    </div>
  );
};

export default EmptyChatState;
