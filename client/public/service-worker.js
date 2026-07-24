/**
 * GreenAlert Service Worker
 *
 * This runs in the background, separate from the web page.
 * It handles:
 *  - Push events (when a push notification arrives from the server)
 *  - Notification click events (when user clicks on a notification)
 *
 * Completely free — uses the browser's built-in push service.
 * No third-party API needed.
 */

// PWA: Cache static assets on install
const CACHE_NAME = 'greenalert-v1';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for navigation requests, cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Listen for push events from the server
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const title = data.title || 'GreenAlert';
    const options = {
      body: data.body || '',
      icon: data.icon || '/GreenAlert Logo.png',
      badge: data.badge || '/GreenAlert Logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        timestamp: data.timestamp || Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'View Details',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('SW: Failed to parse push notification:', err);
  }
});

// Listen for notification click events
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // Try to focus an existing window/tab, or open a new one
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (windowClients) {
        // Check if there's already a window with the right URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
