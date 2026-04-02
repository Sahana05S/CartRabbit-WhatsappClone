let lastPlayed = 0;

export const playSubtleBeep = () => {
  // debounce 2 seconds to avoid spamming
  if (Date.now() - lastPlayed < 2000) return;
  lastPlayed = Date.now();
  
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    // Resume audio context if it was suspended (browser policy)
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // A subtle wooden "pop" or "bloop" sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

export const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(console.warn);
  }
};

let lastNotificationMessageId = null;

export const showBrowserNotification = (message, senderName) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  // Prevent duplicate notifications for the exact same message
  if (lastNotificationMessageId === message._id) return;
  lastNotificationMessageId = message._id;

  try {
    const textPrefix = message.text ? message.text.substring(0, 40) : 'Sent a file';
    const bodyText = textPrefix + (message.text && message.text.length > 40 ? '...' : '');
    
    const notification = new Notification(`${senderName}`, {
      body: bodyText,
      icon: '/favicon.ico', // fallback icon
      tag: 'chat-message', // replaces previous notification
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error("Failed to show browser notification", error);
  }
};
