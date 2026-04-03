self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, data: payload } = data;

  // Check if any tab is currently open and focused on the sender
  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let activeInConversation = false;

    for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // Custom header/prop check would go here if we had a more complex setup
        // But for MVP, we check if the tab is focused
        if (client.focused && client.url.includes(`userId=${payload.senderId}`)) {
            activeInConversation = true;
            break;
        }
    }

    if (activeInConversation) {
        console.log('User is already viewing the conversation, suppression notification.');
        return;
    }

    return self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/badge.png', // Small monochrome icon for Android/Windows
      data: payload,
      vibrate: [100, 50, 100],
      tag: 'nextalk-message', // replaces previous notification
      renotify: true
    });
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const senderId = event.notification.data?.senderId;
  const targetUrl = senderId ? `/?userId=${senderId}` : '/';

  // Navigate to the chat
  const promiseChain = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // 1. If a tab is already open, focus it and redirect
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(self.location.origin)) {
        client.postMessage({ type: 'NAVIGATE_CHAT', userId: senderId });
        return client.focus();
      }
    }
    // 2. Otherwise open a new tab
    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  });

  event.waitUntil(promiseChain);
});
