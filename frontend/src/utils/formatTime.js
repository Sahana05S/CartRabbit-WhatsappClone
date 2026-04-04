/**
 * Format a timestamp for display in message bubbles (e.g. "09:41 AM")
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format a timestamp for the chat list preview
 * Today → time, Yesterday → "Yesterday", older → short date
 */
export const formatPreviewTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now  = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  if (days < 7)  return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

/**
 * Returns initials from a name string
 */
export const getInitials = (name = '') =>
  name.trim().charAt(0).toUpperCase() || '?';

/**
 * Format timestamp for WhatsApp-style last seen
 * Returns: "today at HH:MM", "yesterday at HH:MM", "on Mon at HH:MM", "on 12 Mar at HH:MM"
 */
export const formatLastSeen = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();

  // Less than a minute ago
  if (now - date < 60000) return 'just now';

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate day difference using calendar dates (not 24h rolling window)
  const today   = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
  const thatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - thatDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `yesterday at ${timeStr}`;
  } else if (diffDays < 7) {
    const weekday = date.toLocaleDateString([], { weekday: 'long' });
    return `on ${weekday} at ${timeStr}`;
  } else {
    const dateLabel = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `on ${dateLabel} at ${timeStr}`;
  }
};

/**
 * Format a timestamp for detailed info (e.g. "12 Mar 2024, 09:41 PM")
 */
export const formatFullDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  return `${date.toLocaleDateString([], dateOptions)}, ${date.toLocaleTimeString([], timeOptions)}`;
};

/**
 * Format seconds into mm:ss
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
