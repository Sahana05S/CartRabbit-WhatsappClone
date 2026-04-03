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

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const swUrl = `${window.location.origin}/sw.js`;
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log('SW registered successfully on scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
  }
};

export const subscribeToPush = async (user) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      // Logic could go here to check if this already exists in the backend, 
      // but notificationController handles duplicates.
      return existingSubscription;
    }

    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID PUBLIC KEY missing in environment');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Save to backend
    const api = (await import('../api/axios')).default;
    await api.post('/notifications/subscribe', { subscription });
    
    return subscription;
  } catch (err) {
    console.error('Failed to subscribe for push notifications:', err);
  }
};

export const unsubscribeFromPush = async () => {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const endpoint = subscription.endpoint;
      const api = (await import('../api/axios')).default;
      await api.post('/notifications/unsubscribe', { endpoint });
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error('Failed to unsubscribe from push notifications:', err);
  }
};

export const showBrowserNotification = (message, senderName) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  // Tab is focused and user is in the same chat? No notification!
  if (!document.hidden) return; 
  
  // Prevent duplicate notifications for the exact same message
  if (lastNotificationMessageId === message._id) return;
  lastNotificationMessageId = message._id;

  try {
    const textPrefix = message.text ? message.text.substring(0, 40) : (message.messageType === 'image' ? 'Sent a photo' : 'Sent a file');
    const bodyText = textPrefix + (message.text && message.text.length > 40 ? '...' : '');
    
    const notification = new Notification(`${senderName}`, {
      body: bodyText,
      icon: '/favicon.ico', 
      tag: 'chat-message', 
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error("Failed to show browser notification", error);
  }
};
