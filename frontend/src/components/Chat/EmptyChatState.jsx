import { MessageCircle } from 'lucide-react';

export default function EmptyChatState() {
  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-[#0b0f19] relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="relative z-10 text-center animate-fade-in flex flex-col items-center">
        {/* Animated icon container */}
        <div className="w-24 h-24 mb-6 relative">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-2 bg-gradient-to-br from-accent to-accent-dark rounded-full shadow-accent flex items-center justify-center">
             <MessageCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-text-primary mb-3 tracking-tight">NexTalk Web</h2>
        
        <p className="text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">
          Select a conversation from the sidebar to start messaging. 
          Experience real-time, uninterrupted communication.
        </p>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-surface rounded-full border border-white/5 text-xs text-text-muted shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          End-to-end simulated connection
        </div>
      </div>
      
      {/* Footer stripe */}
      <div className="absolute bottom-8 text-center w-full">
         <p className="text-xs text-text-muted/40 font-medium tracking-wide">
           SECURE • FAST • BEAUTIFUL
         </p>
      </div>
    </div>
  );
}
