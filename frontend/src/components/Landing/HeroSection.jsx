import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent-light/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Side: Copy & Buttons */}
        <div className="flex flex-col items-start text-left z-10">
          <h1 className="text-5xl lg:text-7xl font-extrabold text-text-primary tracking-tight leading-[1.1] mb-6 animate-slide-up">
            Message privately, <br className="hidden lg:block" />instantly.
          </h1>
          
          <p className="text-lg md:text-xl text-text-muted mb-10 max-w-lg animate-slide-up" style={{ animationDelay: '100ms' }}>
            Real-time chat, voice messages, media sharing, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Link to="/login" className="px-8 py-4 text-base font-bold bg-accent hover:bg-accent-light text-white rounded-full transition-all shadow-accent shadow-lg flex items-center justify-center gap-2">
              Start Chatting
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="px-8 py-4 text-base font-bold bg-bg-secondary hover:bg-bg-hover text-text-primary rounded-full transition-all flex items-center justify-center border border-border">
              Explore Features
            </a>
          </div>
        </div>

        {/* Right Side: Phone Mockup */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-md animate-fade-in z-10" style={{ animationDelay: '300ms' }}>
          
          {/* Abstract floating shapes behind the phone */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
          <div className="absolute top-1/2 -left-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl" />

          {/* The Phone Container */}
          <div className="relative bg-bg-panel border-[8px] border-bg-secondary rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[9/19] flex flex-col z-20 ring-1 ring-border shadow-gray-900/10 dark:shadow-black/40">
            
            {/* Phone Header */}
            <div className="h-16 bg-bg-secondary/40 border-b border-border flex items-center px-4 gap-3 z-10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-light flex-shrink-0 shadow-inner" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-text-primary/10 rounded-full mb-1.5" />
                <div className="h-2 w-12 bg-emerald-500/40 rounded-full" />
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-bg-primary/20 relative">
              
              {/* Fake chat background pattern (optional) */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

              {/* Message 1: Received */}
              <div className="self-start max-w-[85%] bg-bg-secondary text-text-primary px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm shadow-sm z-10">
                Hey there! Are we still on for today? ☕
                <div className="text-[9px] text-text-muted mt-1 text-right">10:42 AM</div>
              </div>

              {/* Message 2: Sent */}
              <div className="self-end max-w-[85%] bg-accent text-white px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-[0_2px_10px_-2px_rgba(124,58,237,0.4)] z-10 mt-1">
                Yes absolutely! I'll send the location soon.
                <div className="text-[9px] text-white/80 mt-1 flex items-center justify-end gap-1">
                  10:43 AM 
                  <svg className="w-3 h-3 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>

              {/* Message 3: Received Image placeholder */}
              <div className="self-start max-w-[80%] bg-bg-secondary p-1.5 rounded-2xl rounded-tl-sm shadow-sm z-10 mt-2">
                <div className="w-full h-24 bg-gradient-to-tr from-emerald-500/10 to-accent/10 rounded-xl" />
                <div className="px-2 pb-1 pt-1.5 text-[9px] text-text-muted text-right">10:45 AM</div>
              </div>

              {/* Message 4: Typing Indicator */}
              <div className="self-start bg-bg-secondary px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm z-10 mt-2">
                <div className="flex gap-1.5 items-center h-3">
                  <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-[bounce_1s_infinite_-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-[bounce_1s_infinite_-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-[bounce_1s_infinite]"></span>
                </div>
              </div>
            </div>

            {/* Phone Input Bar */}
            <div className="h-14 bg-bg-secondary/40 border-t border-border flex items-center px-3 gap-2 backdrop-blur-md z-10">
              <div className="w-7 h-7 rounded-full bg-text-primary/5 flex items-center justify-center">
                <div className="w-3.5 h-[2px] bg-text-muted/50 rounded-full" />
                <div className="w-[2px] h-3.5 bg-text-muted/50 rounded-full absolute" />
              </div>
              <div className="flex-1 h-9 rounded-full bg-bg-panel border border-border" />
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-md">
                <Send className="w-4 h-4 text-white -ml-0.5" />
              </div>
            </div>
            
            {/* Phone Home Indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-text-primary/20 rounded-full z-20" />
          </div>
        </div>

      </div>
    </section>
  );
}
