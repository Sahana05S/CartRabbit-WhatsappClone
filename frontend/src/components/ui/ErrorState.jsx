import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function ErrorState({ message, onRetry, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{message || 'Something went wrong'}</span>
        {onRetry && (
          <button onClick={onRetry} className="ml-auto hover:bg-red-500/20 p-1.5 rounded-md transition-colors" title="Retry">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-text-primary font-medium mb-1">Couldn't load content</h3>
      <p className="text-text-muted text-sm max-w-[260px] mx-auto mb-5">
        {message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-bg-secondary hover:bg-bg-hover border border-border text-text-primary text-sm font-medium rounded-full transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
