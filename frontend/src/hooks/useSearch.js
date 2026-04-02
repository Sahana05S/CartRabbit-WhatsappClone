import { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * Client-side search across loaded messages.
 * Returns matched message IDs in order, the current index, and
 * helper functions to navigate and close search.
 */
export function useSearch(messages) {
  const [query,        setQuery]        = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen,       setIsOpen]       = useState(false);

  // Build the ordered list of matching message IDs
  const matchIds = useMemo(() => {
    if (!query.trim() || !messages?.length) return [];
    const lower = query.trim().toLowerCase();
    return messages
      .filter(m => !m.isDeletedForEveryone && m.text && m.text.toLowerCase().includes(lower))
      .map(m => m._id);
  }, [query, messages]);

  // Reset index when query or results change
  useEffect(() => {
    setCurrentIndex(0);
  }, [query]);

  const openSearch  = useCallback(() => setIsOpen(true),  []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setCurrentIndex(0);
  }, []);

  const goNext = useCallback(() => {
    if (!matchIds.length) return;
    setCurrentIndex(i => (i + 1) % matchIds.length);
  }, [matchIds.length]);

  const goPrev = useCallback(() => {
    if (!matchIds.length) return;
    setCurrentIndex(i => (i - 1 + matchIds.length) % matchIds.length);
  }, [matchIds.length]);

  const activeId = matchIds[currentIndex] ?? null;

  return {
    isOpen, openSearch, closeSearch,
    query, setQuery,
    matchIds,
    currentIndex,
    activeId,
    goNext,
    goPrev,
  };
}
