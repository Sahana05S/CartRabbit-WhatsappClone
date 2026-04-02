import { useState } from 'react';
import { FileText, Download, AlertCircle, ZoomIn } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Image attachment ─────────────────────────────────────────────────────── */
function ImageAttachment({ attachment, isSent }) {
  const [lightbox, setLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fullUrl = attachment.fileUrl.startsWith('http')
    ? attachment.fileUrl
    : `${BACKEND_URL}${attachment.fileUrl}`;

  return (
    <>
      <div className="relative group/img cursor-pointer rounded-xl overflow-hidden max-w-[260px]" onClick={() => setLightbox(true)}>
        {imgError ? (
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isSent ? 'bg-bubble-out border-border' : 'bg-bg-secondary border-border'}`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Image unavailable
          </div>
        ) : (
          <>
            <img
              src={fullUrl}
              alt={attachment.fileName || 'Image'}
              className="w-full max-h-[280px] object-cover rounded-xl"
              onError={() => setImgError(true)}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
              <ZoomIn className="w-6 h-6 text-white drop-shadow" />
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <img
            src={fullUrl}
            alt={attachment.fileName || 'Image'}
            className="max-w-full max-h-full object-contain rounded-xl shadow-panel"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

/* ─── File / document attachment ───────────────────────────────────────────── */
function FileAttachment({ attachment, isSent }) {
  const fullUrl = attachment.fileUrl.startsWith('http')
    ? attachment.fileUrl
    : `${BACKEND_URL}${attachment.fileUrl}`;

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.fileName}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl max-w-[260px] transition-opacity hover:opacity-80
        ${isSent ? 'bg-white/10' : 'bg-bg-secondary border border-border'}
      `}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSent ? 'bg-white/20' : 'bg-accent/20'}`}>
        <FileText className={`w-5 h-5 ${isSent ? 'text-white' : 'text-accent-light'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate leading-snug ${isSent ? 'text-white' : 'text-text-primary'}`}>
          {attachment.fileName || 'File'}
        </p>
        <p className={`text-[11px] mt-0.5 ${isSent ? 'text-white/60' : 'text-text-muted'}`}>
          {formatBytes(attachment.fileSize)}
        </p>
      </div>
      <Download className={`w-4 h-4 flex-shrink-0 ${isSent ? 'text-white/70' : 'text-text-muted'}`} />
    </a>
  );
}

/* ─── Main export ──────────────────────────────────────────────────────────── */
export default function AttachmentMessage({ message, isSent }) {
  const { messageType, attachment, text } = message;
  if (!attachment?.fileUrl) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {messageType === 'image'
        ? <ImageAttachment attachment={attachment} isSent={isSent} />
        : <FileAttachment  attachment={attachment} isSent={isSent} />
      }
      {/* Optional caption */}
      {text && (
        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
          {text}
        </p>
      )}
    </div>
  );
}
