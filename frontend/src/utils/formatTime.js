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
 */
export const formatLastSeen = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  // Less than a minute ago
  if (now - date < 60000) return 'Just now';

  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  
  // Calculate day difference conceptually
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - thatDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `today at ${date.toLocaleTimeString([], timeOptions)}`;
  } else if (diffDays === 1) {
    return `yesterday at ${date.toLocaleTimeString([], timeOptions)}`;
  } else if (diffDays < 7) {
    return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], timeOptions)}`;
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  }
};
