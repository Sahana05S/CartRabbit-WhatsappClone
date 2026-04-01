import { formatMessageTime } from '../../utils/formatTime';

export default function MessageBubble({ message, isSent }) {
  return (
    <div
      className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'} animate-slide-up`}
      style={{ animationDuration: '0.2s', animationFillMode: 'both' }}
    >
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 relative group shadow-sm transition-all
          ${isSent 
            ? 'bg-accent text-white rounded-br-[4px]' 
            : 'bg-surface text-text-primary border border-white/[0.04] rounded-bl-[4px]'
          }
        `}
      >
        <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {message.text}
        </p>
        
        <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1.5 font-medium
          ${isSent ? 'text-white/70' : 'text-text-muted'}
        `}>
          <span>{formatMessageTime(message.createdAt)}</span>
          {isSent && (
            <svg 
              className="w-3.5 h-3.5 opacity-80" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
