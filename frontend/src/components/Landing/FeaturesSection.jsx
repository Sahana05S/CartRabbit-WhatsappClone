import { MessageSquare, Mic, Image as ImageIcon, Smile, Palette } from 'lucide-react';

const features = [
  {
    id: 1,
    title: "Real-time Messaging",
    description: "Instant delivery with live updates. Never miss a moment with seamless real-time syncing, typing indicators, and reliable read receipts across all your devices.",
    icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
    mockup: (
      <div className="p-6 bg-bg-panel/80 backdrop-blur-md rounded-[2rem] border border-border shadow-xl flex flex-col gap-3 relative overflow-hidden">
        <div className="self-start bg-bg-secondary text-text-primary px-4 py-2.5 rounded-2xl rounded-tl-sm text-[15px] shadow-sm max-w-[85%]">
          Hey, what time is the meeting?
        </div>
        <div className="self-end bg-accent text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-[15px] shadow-sm max-w-[85%] flex items-end gap-1.5 mt-1">
          It's at 3 PM. See you there!
          <div className="flex -mb-0.5 opacity-80">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
              <polyline points="16 6 12 10"></polyline>
            </svg>
          </div>
        </div>
        <div className="self-start bg-bg-secondary px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-[bounce_1s_infinite_-0.3s]"></span>
          <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-[bounce_1s_infinite_-0.15s]"></span>
          <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-[bounce_1s_infinite]"></span>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Voice Messages",
    description: "Send and receive voice messages easily. When texting isn't enough, just hit record and share your thoughts instantly with rich waveform audio players.",
    icon: <Mic className="w-6 h-6 text-rose-500" />,
    mockup: (
      <div className="p-6 bg-bg-panel/80 backdrop-blur-md rounded-[2rem] border border-border shadow-xl">
        <div className="flex items-center gap-4 bg-accent/5 px-5 py-4 rounded-full border border-accent/20">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 shadow-md">
             <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div className="flex-1 flex items-center justify-between gap-[3px] h-8 px-1">
            {[2, 3, 5, 8, 4, 3, 7, 10, 8, 5, 6, 3, 2, 4, 7, 5, 3].map((h, i) => (
              <div key={i} className="w-[3px] bg-accent rounded-full opacity-80" style={{ height: `${h * 10}%` }}></div>
            ))}
          </div>
          <span className="text-xs font-semibold text-accent ml-2">0:14</span>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Media & File Sharing",
    description: "Share images, videos, and documents seamlessly. Experience a dedicated media gallery, smooth file transfers, and rich image previews without leaving the chat.",
    icon: <ImageIcon className="w-6 h-6 text-purple-500" />,
    mockup: (
      <div className="grid grid-cols-2 gap-3 p-5 bg-bg-panel/80 backdrop-blur-md rounded-[2rem] border border-border shadow-xl transform rotate-1 hover:rotate-0 transition-all duration-300">
        <div className="aspect-[4/3] bg-gradient-to-tr from-purple-500/20 to-blue-500/30 rounded-2xl border border-border/50"></div>
        <div className="aspect-[4/3] bg-gradient-to-bl from-emerald-500/20 to-teal-500/30 rounded-2xl border border-border/50"></div>
        <div className="col-span-2 h-16 bg-bg-secondary/50 rounded-2xl flex items-center px-4 gap-4 border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
             <div className="w-5 h-5 bg-orange-500 rounded-sm opacity-80"></div>
          </div>
          <div className="flex-1">
             <div className="h-2.5 w-32 bg-text-primary/30 rounded-full mb-2"></div>
             <div className="h-1.5 w-16 bg-text-muted/40 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "Reactions & Emojis",
    description: "Express more with reactions, emojis, and GIFs. Sometimes a simple emoji says more than a thousand words. Quick-react to messages to keep the conversation flowing.",
    icon: <Smile className="w-6 h-6 text-amber-500" />,
    mockup: (
      <div className="flex flex-col items-center gap-6 p-8 bg-bg-panel/80 backdrop-blur-md rounded-[2rem] border border-border shadow-xl relative">
        <div className="bg-bg-secondary px-6 py-3.5 rounded-2xl rounded-tl-sm relative shadow-sm text-text-primary text-[15px] w-full max-w-[85%] self-start">
          That is absolutely hilarious! 😂
          <div className="absolute -bottom-3 right-4 flex items-center gap-1 bg-bg-panel rounded-full px-2 py-0.5 border border-border shadow-md z-10 animate-[bounce_2s_infinite]">
             🔥 ❤️ <span className="text-xs font-bold ml-1 text-text-muted">2</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2 bg-bg-panel p-2.5 rounded-full border border-border shadow-xl transform -translate-y-2 self-start ml-4">
           {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji, i) => (
             <div key={i} className="w-9 h-9 flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-default hover:bg-bg-secondary rounded-full">
               {emoji}
             </div>
           ))}
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "Customization",
    description: "Change chat wallpapers and personalize your experience. Choose from built-in presets, select beautiful solid colors, or upload your own wallpaper.",
    icon: <Palette className="w-6 h-6 text-teal-500" />,
    mockup: (
      <div className="flex items-center justify-center p-6 bg-bg-panel/80 backdrop-blur-md rounded-[2rem] border border-border shadow-xl h-full">
         <div className="w-[60%] aspect-[9/16] rounded-2xl border-[6px] border-bg-secondary shadow-lg overflow-hidden relative flex flex-col group transition-transform hover:scale-[1.02]">
            <div className="flex-1 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex flex-col justify-end p-3 gap-2 relative">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
               <div className="self-end w-14 h-4 bg-accent/80 rounded-full shadow-sm z-10"></div>
               <div className="self-start w-20 h-4 bg-bg-secondary/90 rounded-full shadow-sm z-10"></div>
            </div>
            <div className="h-10 bg-bg-panel opacity-95 border-t border-border flex items-center px-3">
               <div className="w-full h-3 bg-bg-secondary rounded-full"></div>
            </div>
         </div>
      </div>
    )
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 px-6 bg-bg-primary relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-32 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 md:mb-24 reveal-on-scroll">
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-6">
            Designed for connection
          </h2>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto">
            Everything you need for a premium messaging experience, thoughtfully crafted to help you communicate effortlessly.
          </p>
        </div>

        {/* Feature blocks alternating */}
        {features.map((feature, idx) => {
          const isEven = idx % 2 === 1;
          return (
            <div key={feature.id} className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 lg:gap-24 group reveal-on-scroll delay-100`}>
              
              {/* Mockup side */}
              <div className="flex-1 w-full max-w-md relative transition-transform duration-500 group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent rounded-[2rem] blur-xl -z-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
                {feature.mockup}
              </div>

              {/* Text side */}
              <div className="flex-1 text-center md:text-left space-y-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-secondary border border-border shadow-sm mb-2 transition-transform group-hover:scale-110 ${isEven ? 'md:mx-0 mx-auto' : 'mx-auto md:mx-0'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-lg text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
