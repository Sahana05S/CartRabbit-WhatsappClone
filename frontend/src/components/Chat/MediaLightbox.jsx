import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function resolveUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

export default function MediaLightbox({ items, index, onClose, onNavigate }) {
  const item = items?.[index];
  const total = items?.length ?? 0;

  const goNext = useCallback(() => {
    if (index < total - 1) onNavigate(index + 1);
  }, [index, total, onNavigate]);

  const goPrev = useCallback(() => {
    if (index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  goNext();
      if (e.key === 'ArrowLeft')   goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!item) return null;

  const isVideo  = item.attachment?.mimeType?.startsWith('video/');
  const url      = resolveUrl(item.attachment?.fileUrl);
  const filename = item.attachment?.fileName || 'Media';

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Top bar — filename + download + close */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3
                   bg-gradient-to-b from-black/70 to-transparent z-10"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/80 text-sm font-medium truncate max-w-[60%]">
          {filename}
        </span>
        <div className="flex items-center gap-1">
          <a
            href={url}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Download"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div
        className="relative flex items-center justify-center w-full h-full px-16"
        onClick={e => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            key={url}
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
          />
        ) : (
          <img
            key={url}
            src={url}
            alt={filename}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
            onError={e => { e.currentTarget.style.opacity = '0.3'; }}
          />
        )}
      </div>

      {/* Prev arrow */}
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/50
                     hover:bg-black/70 text-white rounded-full transition-all
                     hover:scale-110 active:scale-95"
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next arrow */}
      {index < total - 1 && (
        <button
          onClick={e => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/50
                     hover:bg-black/70 text-white rounded-full transition-all
                     hover:scale-110 active:scale-95"
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Bottom counter */}
      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2
                        bg-black/50 text-white/70 text-xs px-3 py-1 rounded-full">
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}
