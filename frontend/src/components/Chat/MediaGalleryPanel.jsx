import { useState, useEffect } from 'react';
import { X, ImageIcon, Video, Paperclip } from 'lucide-react';
import MediaGalleryImages from './MediaGalleryImages';
import MediaGalleryVideos from './MediaGalleryVideos';
import MediaGalleryFiles  from './MediaGalleryFiles';

const TABS = [
  { id: 'images', label: 'Photos',    Icon: ImageIcon  },
  { id: 'videos', label: 'Videos',    Icon: Video      },
  { id: 'files',  label: 'Documents', Icon: Paperclip  },
];

export default function MediaGalleryPanel({ chatId, onClose }) {
  const [activeTab, setActiveTab] = useState('images');

  // Reset to photos tab whenever we switch to a different chat
  useEffect(() => {
    setActiveTab('images');
  }, [chatId]);

  return (
    <div className="w-[360px] flex flex-col bg-bg-panel border-l border-white/[0.06] h-full flex-shrink-0 animate-slide-left">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="h-[72px] flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        <h2 className="text-text-primary font-semibold text-[15px]">Media, Links, Docs</h2>
        <button
          onClick={onClose}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors"
          aria-label="Close gallery"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.06] flex-shrink-0 bg-bg-panel">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex-1 flex flex-col items-center gap-1 pt-3 pb-2.5 text-[11px] font-medium
                transition-all duration-200 relative
                ${active
                  ? 'text-accent-light'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]'}
              `}
            >
              <Icon
                className={`w-[18px] h-[18px] transition-colors ${active ? 'text-accent-light' : ''}`}
                strokeWidth={active ? 2 : 1.5}
              />
              <span>{label}</span>
              {/* Active indicator line */}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-accent-light" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'images' && <MediaGalleryImages chatId={chatId} />}
        {activeTab === 'videos' && <MediaGalleryVideos chatId={chatId} />}
        {activeTab === 'files'  && <MediaGalleryFiles  chatId={chatId} />}
      </div>
    </div>
  );
}
