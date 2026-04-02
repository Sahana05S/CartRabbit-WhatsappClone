import { useEffect, useRef } from 'react';
import { Trash2, X } from 'lucide-react';

/**
 * Compact confirmation sheet — modelled after WhatsApp.
 * Shows "Delete for me" and optionally "Delete for everyone" (own messages only).
 */
export default function DeleteMessageMenu({ isSent, onDeleteForMe, onDeleteForEveryone, onClose }) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    /* Full-screen transparent backdrop */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        ref={ref}
        className="w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-bg-panel border border-white/10 rounded-2xl shadow-panel overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
            <Trash2 className="w-4 h-4 text-red-400" />
            Delete message
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 flex flex-col gap-1">
          {/* Delete for everyone — only the sender sees this */}
          {isSent && (
            <button
              onClick={onDeleteForEveryone}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              Delete for everyone
            </button>
          )}

          <button
            onClick={onDeleteForMe}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-white/5 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0 opacity-60" />
            Delete for me
          </button>

          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:bg-white/5 transition-colors text-left"
          >
            <X className="w-4 h-4 flex-shrink-0 opacity-60" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
