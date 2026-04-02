import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ type = 'spinner' }) {
  if (type === 'chat-list') {
    return (
      <div className="flex flex-col w-full h-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border w-full animate-pulse">
            <div className="w-12 h-12 rounded-full bg-bg-hover flex-shrink-0" />
            <div className="flex-1 min-w-0 py-1">
              <div className="flex justify-between items-center mb-2">
                <div className="w-24 h-4 bg-bg-hover rounded-md" />
                <div className="w-10 h-3 bg-bg-hover rounded-md" />
              </div>
              <div className="w-3/4 h-3 bg-bg-hover rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'message-list') {
    return (
      <div className="flex flex-col p-6 w-full h-full justify-end opacity-60">
        {[...Array(4)].map((_, i) => {
          const isSent = i % 2 !== 0;
          return (
            <div key={i} className={`flex w-full mb-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
              <div className={`w-[200px] h-12 rounded-lg animate-pulse ${isSent ? 'bg-bubble-out opacity-50' : 'bg-bg-panel border border-border'}`} />
            </div>
          );
        })}
      </div>
    );
  }

  // Default block spinner
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <span className="text-sm text-text-muted font-medium">Loading…</span>
    </div>
  );
}
