import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle, Download, FileText, FileImage, FileVideo,
  FileAudio, FileCode, FileArchive, File, Paperclip,
} from 'lucide-react';
import api from '../../api/axios';
import EmptyState from '../ui/EmptyState';
import { formatPreviewTime } from '../../utils/formatTime';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function resolveUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Extension → icon + colour ─────────────────────────────────────────────── */
function getFileDisplay(mimeType = '', fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  const m   = mimeType.toLowerCase();

  if (m.startsWith('image/'))  return { Icon: FileImage,   color: 'text-purple-400',  bg: 'bg-purple-400/10' };
  if (m.startsWith('video/'))  return { Icon: FileVideo,   color: 'text-blue-400',    bg: 'bg-blue-400/10'   };
  if (m.startsWith('audio/'))  return { Icon: FileAudio,   color: 'text-pink-400',    bg: 'bg-pink-400/10'   };
  if (m === 'application/pdf')                          return { Icon: FileText,    color: 'text-red-400',     bg: 'bg-red-400/10'    };
  if (['doc','docx'].includes(ext)) /* Word */          return { Icon: FileText,    color: 'text-blue-500',    bg: 'bg-blue-500/10'   };
  if (['xls','xlsx','csv'].includes(ext)) /* Excel */   return { Icon: FileText,    color: 'text-green-400',   bg: 'bg-green-400/10'  };
  if (['ppt','pptx'].includes(ext)) /* PPT */           return { Icon: FileText,    color: 'text-orange-400',  bg: 'bg-orange-400/10' };
  if (['zip','rar','7z','tar','gz'].includes(ext))      return { Icon: FileArchive,  color: 'text-yellow-400',  bg: 'bg-yellow-400/10' };
  if (['js','ts','jsx','tsx','py','java','c','cpp','go','rb','sh','json','html','css'].includes(ext)) {
    return { Icon: FileCode, color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  }
  return { Icon: File, color: 'text-text-muted', bg: 'bg-bg-hover' };
}

/* ── Single file row ────────────────────────────────────────────────────────── */
function FileRow({ message }) {
  const [broken, setBroken] = useState(false);
  const att      = message.attachment || {};
  const url      = resolveUrl(att.fileUrl);
  const { Icon, color, bg } = getFileDisplay(att.mimeType, att.fileName || '');
  const size     = formatBytes(att.fileSize);
  const date     = formatPreviewTime(message.createdAt);
  const name     = att.fileName || 'File';

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors group">
      {/* File type icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-text-primary truncate leading-snug">
          {name}
        </p>
        <p className="text-[11px] text-text-muted mt-0.5">
          {[size, date].filter(Boolean).join(' · ')}
        </p>
        {broken && (
          <p className="text-[11px] text-red-400 mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Unavailable
          </p>
        )}
      </div>

      {/* Download button */}
      {!broken ? (
        <a
          href={url}
          download={name}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-text-muted hover:text-accent-light hover:bg-accent/10 rounded-full
                     transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          title="Download"
          onClick={e => e.stopPropagation()}
          onError={() => setBroken(true)}
        >
          <Download className="w-4 h-4" />
        </a>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-bg-hover flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-bg-hover rounded w-3/4" />
        <div className="h-2.5 bg-bg-hover rounded w-1/3" />
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function MediaGalleryFiles({ chatId, isGroup }) {
  const [items,   setItems]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const sentinelRef = useRef(null);
  const observer    = useRef(null);
  const fetching    = useRef(false);

  const fetchPage = useCallback(async (p) => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/messages/media/${chatId}?type=file&page=${p}&limit=20${isGroup ? '&isGroup=true' : ''}`);
      const { messages, totalPages } = res.data;
      setItems(prev => p === 1 ? messages : [...prev, ...messages]);
      setHasMore(p < totalPages);
      setPage(p);
    } catch (err) {
      setError('Could not load files. Tap to retry.');
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
          icon={Paperclip}
          title="No documents yet"
          description="Files and documents shared in this chat will appear here."
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
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      )}

      {items.length > 0 && (
        <div className="divide-y divide-border">
          {items.map(msg => <FileRow key={msg._id} message={msg} />)}
          {loading && Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={`sk-${i}`} />)}
        </div>
      )}

      {hasMore && !loading && <div ref={sentinelRef} className="h-6" />}
    </div>
  );
}
