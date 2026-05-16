// Service Worker - Handles offline caching and request interception
// Caches essential files on first visit, serves cached versions when offline

const CACHE_NAME = 'hsc-routine-v1';

// Files to cache on first install
const URLS_TO_CACHE = [
  './',
  './index.html',
  './register-sw.js',
  './service-worker.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Share+Tech+Mono&family=Barlow:wght@300;400;500&display=swap'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(URLS_TO_CACHE.map(async url => {
      try {
        const resp = await fetch(url, { mode: 'no-cors' });
        if (resp) await cache.put(url, resp.clone());
      } catch (e) {
        // ignore individual failures
      }
    }));
  })());
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => cacheName !== CACHE_NAME ? caches.delete(cacheName) : null)
    ))
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // For page navigations, prefer network so users receive updated HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => caches.match(request).then(resp => resp || caches.match('./index.html').then(fallback => fallback || caches.match('./'))))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;

        const fetchRequest = request.clone();

        return fetch(fetchRequest).then(response => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return response;
        });
      })
      .catch(() => caches.match('./index.html').then(resp => resp || caches.match('./')))
  );
});
