import { MessageCircle } from 'lucide-react';

export default function EmptyChatState() {
  return (
    <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-bg-primary relative overflow-hidden transition-colors">
      
      <div className="relative z-10 text-center animate-fade-in flex flex-col items-center">
        <div className="w-[120px] h-[120px] mb-8 bg-bg-secondary rounded-full flex items-center justify-center border border-border">
             <MessageCircle className="w-12 h-12 text-text-muted opacity-50" strokeWidth={1} />
        </div>
        
        <h2 className="text-3xl font-light text-text-primary mb-4 tracking-tight">NexTalk for Web</h2>
        
        <p className="text-text-muted max-w-md mx-auto mb-8 leading-relaxed text-sm">
          Send and receive messages without keeping your phone online.<br/>
          Use NexTalk on up to 4 linked devices and 1 phone at the same time.
        </p>
        
        <div className="flex items-center gap-2 text-xs text-text-muted opacity-80">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          End-to-end simulated connection
        </div>
      </div>
    </div>
  );
}
