import { X, Image, FileText, Music } from 'lucide-react';

// Returns the right label + icon for non-text media types
function MediaLabel({ messageType }) {
  if (messageType === 'image') return (
    <span className="flex items-center gap-1 text-text-muted">
      <Image className="w-3 h-3 flex-shrink-0" /> Photo
    </span>
  );
  if (messageType === 'audio') return (
    <span className="flex items-center gap-1 text-text-muted">
      <Music className="w-3 h-3 flex-shrink-0" /> Audio
    </span>
  );
  if (messageType === 'file') return (
    <span className="flex items-center gap-1 text-text-muted">
      <FileText className="w-3 h-3 flex-shrink-0" /> File
    </span>
  );
  return null;
}

export default function ReplyPreview({ replyTo, onCancel }) {
  if (!replyTo) return null;

  const isText    = !replyTo.messageType || replyTo.messageType === 'text';
  const preview   = replyTo.previewText || '';
  const truncated = preview.length > 100 ? preview.slice(0, 100) + '…' : preview;

  return (
    <div className="mx-3 md:mx-6 mb-1 flex items-center gap-2 bg-bg-secondary border border-white/[0.06] rounded-xl px-3 py-2 animate-slide-up">
      {/* Accent left bar */}
      <div className="w-[3px] self-stretch rounded-full bg-accent-light flex-shrink-0" />

      <div className="flex-1 min-w-0">
        {/* Sender name */}
        <p className="text-[12px] font-semibold text-accent-light truncate mb-0.5">
          {replyTo.senderName || 'Unknown'}
        </p>

        {/* Content preview — text vs. media */}
        {isText ? (
          <p className="text-[12px] text-text-muted truncate">
            {truncated || 'Message'}
          </p>
        ) : (
          <p className="text-[12px]">
            <MediaLabel messageType={replyTo.messageType} />
          </p>
        )}
      </div>

      <button
        onClick={onCancel}
        className="p-1 rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        aria-label="Cancel reply"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
