/**
 * PharmaMatch Web Push Service Worker
 * Strictly handles Push events and Notification clicks.
 * (No offline caching, no PWA features)
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'PharmaMatch Notification',
      body: event.data.text(),
      data: { url: '/' }
    };
  }

  const title = payload.title || 'PharmaMatch Alert';
  const options = {
    body: payload.body || payload.message || '',
    icon: payload.icon || '/vite.svg',
    badge: payload.badge || '/vite.svg',
    tag: payload.tag || `pharmamatch-${Date.now()}`,
    data: payload.data || { url: '/' },
    vibrate: [200, 100, 200],
    requireInteraction: payload.priority === 'CRITICAL' || payload.priority === 'HIGH'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the app
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
