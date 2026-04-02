import { useEffect, useState } from 'react';
import { X, Check, CheckCheck, Forward, Star, Reply, Paperclip, ImageIcon, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format a timestamp for Message Info display:
 *   same day  → "10:42 PM"
 *   other day → "12 Mar · 10:42 PM"
 */
const formatInfoTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now  = new Date();

  const today   = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
  const thatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - thatDay) / 86_400_000);

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return timeStr;
  if (diffDays === 1) return `Yesterday · ${timeStr}`;

  const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${dateStr} · ${timeStr}`;
};

// ─── Row sub-component ────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, iconClass = 'text-text-muted', label, value, valueMuted = false }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueMuted ? 'text-text-muted' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MessageInfoPanel({ messageId, onClose }) {
  const { currentUser } = useAuth();
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/messages/info/${messageId}`);
        if (!cancelled) setInfo(data.message);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load message info.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [messageId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Derived flags (available once loaded)
  const isSent     = info ? (info.senderId?._id || info.senderId) === currentUser._id : false;
  const isStarred  = info ? (info.starredBy || []).some(id => (id?._id ?? id)?.toString() === currentUser._id) : false;
  const hasReply   = !!info?.replyTo?.messageId;
  const isDeleted  = !!info?.isDeletedForEveryone;
  const msgType    = info?.messageType || 'text';
  const hasAttach  = msgType === 'image' || msgType === 'file';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel — slides in from the right */}
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-bg-panel border-l border-border flex flex-col shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[72px] px-5 flex items-center gap-4 border-b border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">Message Info</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">

          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-accent-light" />
              <span className="text-sm text-text-muted">Loading…</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm text-center">
              {error}
            </div>
          )}

          {info && !loading && (
            <>
              {/* ── Message preview ── */}
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words
                ${isSent
                  ? 'bg-bubble-out text-text-primary rounded-br-[4px] ml-auto max-w-[85%]'
                  : 'bg-bubble-in text-text-primary border border-border rounded-bl-[4px] max-w-[85%]'
                }
              `}>
                {isDeleted ? (
                  <span className="italic opacity-60">This message was deleted</span>
                ) : hasAttach ? (
                  <div className="flex items-center gap-2 opacity-80">
                    {msgType === 'image'
                      ? <ImageIcon className="w-4 h-4" />
                      : <Paperclip className="w-4 h-4" />
                    }
                    <span className="italic">
                      {msgType === 'image' ? 'Photo' : info.attachment?.fileName || 'File'}
                    </span>
                  </div>
                ) : (
                  <span>{info.text || <em className="opacity-50">No content</em>}</span>
                )}
              </div>

              {/* ── Delivery status ── */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1 px-1">
                  Delivery
                </p>
                <div className="bg-bg-secondary border border-border rounded-xl px-4 divide-y divide-border">

                  {/* Sent */}
                  <InfoRow
                    icon={Check}
                    iconClass="text-text-muted"
                    label="Sent"
                    value={formatInfoTime(info.createdAt) ?? '—'}
                  />

                  {/* Delivered — stored as message.deliveredAt if present, else inferred from status */}
                  <InfoRow
                    icon={CheckCheck}
                    iconClass={info.status === 'delivered' || info.status === 'read' ? 'text-text-muted' : 'text-text-muted/40'}
                    label="Delivered"
                    value={
                      formatInfoTime(info.deliveredAt) ??
                      (info.status === 'delivered' || info.status === 'read' ? 'Yes' : '—')
                    }
                    valueMuted={!info.deliveredAt && !(info.status === 'delivered' || info.status === 'read')}
                  />

                  {/* Seen / Read */}
                  <InfoRow
                    icon={CheckCheck}
                    iconClass={info.status === 'read' ? 'text-blue-400' : 'text-text-muted/40'}
                    label="Seen"
                    value={formatInfoTime(info.readAt) ?? '—'}
                    valueMuted={!info.readAt}
                  />
                </div>
              </section>

              {/* ── Message details ── */}
              <section>
                <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1 px-1">
                  Details
                </p>
                <div className="bg-bg-secondary border border-border rounded-xl px-4 divide-y divide-border">

                  <InfoRow
                    icon={Star}
                    iconClass={isStarred ? 'text-yellow-400' : 'text-text-muted/40'}
                    label="Starred"
                    value={isStarred ? 'Yes' : 'No'}
                    valueMuted={!isStarred}
                  />

                  <InfoRow
                    icon={Forward}
                    iconClass={info.isForwarded ? 'text-accent-light' : 'text-text-muted/40'}
                    label="Forwarded"
                    value={info.isForwarded ? 'Yes' : 'No'}
                    valueMuted={!info.isForwarded}
                  />

                </div>
              </section>

              {/* ── Reply reference ── */}
              {hasReply && (
                <section>
                  <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1 px-1">
                    Replying to
                  </p>
                  <div className="bg-bg-secondary border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                    <Reply className="w-4 h-4 text-accent-light flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-accent-light mb-0.5 truncate">
                        {info.replyTo.senderName || 'Unknown'}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {info.replyTo.messageType !== 'text'
                          ? (info.replyTo.messageType === 'image' ? '📷 Photo' : '📎 File')
                          : (info.replyTo.previewText || 'Message')
                        }
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
