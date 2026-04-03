const webpush = require('web-push');

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@nextalk.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Sends a push notification to all subscriptions of a user
 * @param {Object} user - User document
 * @param {Object} payload - Notification data (title, body, icon, url, etc)
 */
const sendPushNotification = async (user, payload) => {
  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;
  
  // Check user settings before sending if relevant
  if (user.settings?.notifications?.desktop === false) return;

  const showPreview = user.settings?.notifications?.preview !== false;
  const pushPayload = JSON.stringify({
    title: payload.title || 'New Message',
    body:  showPreview ? (payload.body || 'You have a new message on NexTalk.') : 'You have a new message',
    icon:  payload.icon  || '/favicon.ico',
    data: {
      url: payload.url || '/chat',
      senderId: payload.senderId
    }
  });

  const promises = user.pushSubscriptions.map(sub => 
    webpush.sendNotification(sub, pushPayload).catch(err => {
      // If subscription expired or invalid, we should remove it
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log('Push subscription expired, removing...');
        return 'REMOVE_SUB';
      }
      console.error('Push error:', err.message);
    })
  );

  const results = await Promise.all(promises);
  const expiredSubs = results.filter(r => r === 'REMOVE_SUB');
  
  if (expiredSubs.length > 0) {
    // Optionally clean up expired subscriptions later
  }
};

const getMessagePreview = (message) => {
  if (message.messageType === 'text') {
    return message.text.substring(0, 100) + (message.text.length > 100 ? '...' : '');
  }
  if (message.messageType === 'image') return '📷 Photo';
  if (message.messageType === 'video') return '🎥 Video';
  if (message.messageType === 'audio') return '🎵 Voice message';
  if (message.messageType === 'file')  return '📎 Document';
  if (message.messageType === 'gif')   return '🎬 GIF';
  if (message.messageType === 'sticker') return '🖼️ Sticker';
  return 'New shared content';
};

module.exports = { sendPushNotification, getMessagePreview };
