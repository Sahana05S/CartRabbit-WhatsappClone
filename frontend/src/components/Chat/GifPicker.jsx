import { useState, useEffect, useRef } from 'react';
import { Search, Smile, Play, Box, Loader2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { searchGifs, trendingGifs, searchStickers, trendingStickers } from '../../services/giphyService';

export default function GifPicker({ onEmojiClick, onGifSelect, onStickerSelect, theme = 'dark' }) {
  const [activeTab, setActiveTab ] = useState('emoji'); // 'emoji', 'gif', 'sticker'
  const [query,      setQuery]     = useState('');
  const [results,    setResults]   = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'emoji') return;
    
    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = activeTab === 'gif' ? await trendingGifs() : await trendingStickers();
        setResults(response.data || []);
      } catch (err) {
        setError('Failed to load trending content.');
      } finally {
        setLoading(false);
      }
    };

    if (!query) fetchInitial();
  }, [activeTab]);

  useEffect(() => {
    if (!query || activeTab === 'emoji') {
       if (!query && activeTab !== 'emoji') {
         // Re-fetch trending when search cleared
         const reFetch = async () => {
            const resp = activeTab === 'gif' ? await trendingGifs() : await trendingStickers();
            setResults(resp.data || []);
         };
         reFetch();
       }
       return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = activeTab === 'gif' ? await searchGifs(query) : await searchStickers(query);
        setResults(response.data || []);
      } catch (err) {
        setError('Search failed.');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [query, activeTab]);

  return (
    <div className={`flex flex-col w-[320px] h-[450px] bg-bg-panel border border-border shadow-2xl rounded-2xl overflow-hidden transition-colors ${theme}`}>
      
      {/* Tabs */}
      <div className="flex bg-bg-secondary p-1 shrink-0">
        <button 
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all
            ${activeTab === 'emoji' ? 'bg-bg-panel text-accent-light shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          <Smile className="w-4 h-4" /> Emojis
        </button>
        <button 
          onClick={() => setActiveTab('gif')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all
            ${activeTab === 'gif' ? 'bg-bg-panel text-accent-light shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          <Play className="w-4 h-4" /> GIFs
        </button>
        <button 
          onClick={() => setActiveTab('sticker')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all
            ${activeTab === 'sticker' ? 'bg-bg-panel text-accent-light shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          <Box className="w-4 h-4" /> Stickers
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {activeTab === 'emoji' ? (
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={theme === 'dark' ? 'dark' : 'light'}
            width="100%"
            height="100%"
            skinTonesDisabled={true}
            searchDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        ) : (
          <>
            {/* Search Input */}
            <div className="p-3 bg-bg-panel border-b border-border/50 sticky top-0 z-10">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-accent-light transition-colors" />
                <input 
                  autoFocus
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${activeTab}s...`}
                  className="w-full bg-bg-secondary border border-transparent rounded-xl pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent/30 transition-all outline-none"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-1.5 py-1.5 custom-scrollbar bg-bg-panel">
              {loading && results.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-panel/50 z-20 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
                    <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs mt-1 opacity-60">Try searching for something else</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {results.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => activeTab === 'gif' ? onGifSelect(item) : onStickerSelect(item)}
                      className={`relative group aspect-square rounded-lg overflow-hidden bg-bg-secondary hover:ring-2 hover:ring-accent transition-all duration-200
                        ${activeTab === 'sticker' ? 'p-2' : ''}`}
                    >
                      <img 
                        src={item.images.fixed_width.url} 
                        alt={item.title}
                        loading="lazy"
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500
                          ${activeTab === 'sticker' ? 'object-contain' : 'object-cover'}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Giphy Attribution */}
            <div className="py-2 px-3 bg-bg-secondary flex justify-center border-t border-border/50 shrink-0">
               <div className="flex items-center gap-1 opacity-50 contrast-125 hover:opacity-100 transition-opacity">
                 <img 
                   src="/giphy-attribution.png" 
                   alt="GIPHY" 
                   className="h-4 cursor-pointer"
                   onError={(e) => {
                     e.target.style.display = 'none';
                     e.target.nextSibling.style.display = 'block';
                   }} 
                 />
                 <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted hidden" style={{ display: 'none' }}>
                   Powered by GIPHY
                 </span>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
