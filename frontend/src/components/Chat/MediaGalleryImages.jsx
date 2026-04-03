import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import MediaLightbox from './MediaLightbox';
import EmptyState from '../ui/EmptyState';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
function resolveUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

/* ── Single image cell ─────────────────────────────────────────────────────── */
function ImageCell({ message, index, onClick }) {
  const [errored, setErrored] = useState(false);
  const url = resolveUrl(message.attachment?.fileUrl);

  return (
    <button
      className="relative aspect-square overflow-hidden bg-bg-panel group focus:outline-none"
      onClick={() => onClick(index)}
      title={message.attachment?.fileName || 'Photo'}
    >
      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-bg-hover">
          <AlertCircle className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
          <span className="text-[10px] text-text-muted">Unavailable</span>
        </div>
      ) : (
        <>
          <img
            src={url}
            alt={message.attachment?.fileName || 'Photo'}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setErrored(true)}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200" />
        </>
      )}
    </button>
  );
}

/* ── Skeleton placeholder ──────────────────────────────────────────────────── */
function Skeleton() {
  return <div className="aspect-square bg-bg-panel animate-pulse" />;
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function MediaGalleryImages({ chatId, isGroup }) {
  const [items,    setItems]    = useState([]);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lightbox, setLightbox] = useState(null); // open index

  const sentinelRef = useRef(null);
  const observer    = useRef(null);
  const fetching    = useRef(false);

  const fetchPage = useCallback(async (p) => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/messages/media/${chatId}?type=image&page=${p}&limit=24${isGroup ? '&isGroup=true' : ''}`);
      const { messages, totalPages } = res.data;
      setItems(prev => p === 1 ? messages : [...prev, ...messages]);
      setHasMore(p < totalPages);
      setPage(p);
    } catch (err) {
      setError('Could not load photos. Tap to retry.');
      console.error(err);
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, [chatId]);

  // Initial load
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    fetching.current = false;
    fetchPage(1);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll sentinel
  useEffect(() => {
    observer.current?.disconnect();
    if (!hasMore || loading) return;
    observer.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchPage(page + 1); },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.current.observe(sentinelRef.current);
    return () => observer.current?.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  const isEmpty = !loading && !error && items.length === 0;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">

      {/* Empty state */}
      {isEmpty && (
        <EmptyState
          icon={ImageIcon}
          title="No photos yet"
          description="Photos shared in this chat will appear here."
        />
      )}

      {/* Error state (when nothing loaded) */}
      {error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
          <AlertCircle className="w-8 h-8" strokeWidth={1.5} />
          <p className="text-sm text-center px-6">{error}</p>
          <button
            onClick={() => fetchPage(1)}
            className="text-sm text-accent-light hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-[2px] bg-border">
          {items.map((msg, i) => (
            <ImageCell key={msg._id} message={msg} index={i} onClick={setLightbox} />
          ))}
          {/* Loading skeletons appended at end */}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} />
          ))}
        </div>
      )}

      {/* Initial loading state — full grid of skeletons */}
      {loading && items.length === 0 && (
        <div className="grid grid-cols-3 gap-[2px] bg-border">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {/* Scroll sentinel */}
      {hasMore && !loading && <div ref={sentinelRef} className="h-6" />}

      {/* Lightbox */}
      {lightbox !== null && (
        <MediaLightbox
          items={items}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </div>
  );
}
