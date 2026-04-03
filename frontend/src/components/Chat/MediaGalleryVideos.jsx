import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Play, Video } from 'lucide-react';
import api from '../../api/axios';
import MediaLightbox from './MediaLightbox';
import EmptyState from '../ui/EmptyState';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
function resolveUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

/* ── Single video cell ─────────────────────────────────────────────────────── */
function VideoCell({ message, index, onClick }) {
  const [errored, setErrored] = useState(false);
  const url = resolveUrl(message.attachment?.fileUrl);

  return (
    <button
      className="relative aspect-square overflow-hidden bg-bg-panel group focus:outline-none"
      onClick={() => onClick(index)}
      title={message.attachment?.fileName || 'Video'}
    >
      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-bg-hover">
          <AlertCircle className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
          <span className="text-[10px] text-text-muted">Unavailable</span>
        </div>
      ) : (
        <>
          {/* preload="metadata" loads only the first frame — lightweight */}
          <video
            src={url}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={() => setErrored(true)}
          />
          {/* Dark overlay + play icon */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
                            group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200 shadow-lg">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        </>
      )}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="aspect-square bg-bg-panel animate-pulse flex items-center justify-center">
      <Play className="w-5 h-5 text-text-muted opacity-20" />
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function MediaGalleryVideos({ chatId, isGroup }) {
  const [items,    setItems]    = useState([]);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const sentinelRef = useRef(null);
  const observer    = useRef(null);
  const fetching    = useRef(false);

  const fetchPage = useCallback(async (p) => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/messages/media/${chatId}?type=video&page=${p}&limit=18${isGroup ? '&isGroup=true' : ''}`);
      const { messages, totalPages } = res.data;
      setItems(prev => p === 1 ? messages : [...prev, ...messages]);
      setHasMore(p < totalPages);
      setPage(p);
    } catch (err) {
      setError('Could not load videos. Tap to retry.');
      console.error(err);
    } finally {
      setLoading(false);
      fetching.current = false;
    }
  }, [chatId]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    fetching.current = false;
    fetchPage(1);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {isEmpty && (
        <EmptyState
          icon={Video}
          title="No videos yet"
          description="Videos shared in this chat will appear here."
        />
      )}

      {error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
          <AlertCircle className="w-8 h-8" strokeWidth={1.5} />
          <p className="text-sm text-center px-6">{error}</p>
          <button onClick={() => fetchPage(1)} className="text-sm text-accent-light hover:underline">
            Retry
          </button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="grid grid-cols-3 gap-[2px] bg-border">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-[2px] bg-border">
          {items.map((msg, i) => (
            <VideoCell key={msg._id} message={msg} index={i} onClick={setLightbox} />
          ))}
          {loading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={`sk-${i}`} />)}
        </div>
      )}

      {hasMore && !loading && <div ref={sentinelRef} className="h-6" />}

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
