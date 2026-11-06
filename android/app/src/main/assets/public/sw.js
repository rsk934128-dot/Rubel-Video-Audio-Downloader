// Progressive Web App Service Worker with Background Real-time Notifications and Cache Management
const CACHE_NAME = 'downloader-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/icon.svg',
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache skipped some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Claim clients and purge outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first with cache fallback for same-origin assets, strictly bypassing APIs and Google Auth
self.addEventListener('fetch', (event) => {
  // CRITICAL: Only handle GET requests for same-origin static assets
  if (event.request.method !== 'GET') {
    return;
  }

  // Never intercept cross-origin requests (Google Auth, APIs, Firestore, CDNs, dicebear, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Never cache or intercept server API routes, Firebase auth handlers, or downloads
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/') ||
    url.pathname.includes('/auth/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});

// Background / Client Message Channel for Real-time Notifications
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data } = event.data;
    const options = {
      body: body || 'মিডিয়া ডাউনলোড প্রক্রিয়া চলমান রয়েছে।',
      icon: icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || 'downloader-task',
      renotify: true,
      vibrate: [200, 100, 200],
      data: data || { url: '/' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Notification Click Event: Focus existing window or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

