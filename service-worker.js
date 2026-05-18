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

async function cacheResponse(cache, request, response) {
  if (!response) return;

  if (response.type === 'opaque' || response.ok) {
    await cache.put(request, response.clone());
  }
}

async function fallbackToAppShell(request) {
  const cachedRequest = await caches.match(request);
  if (cachedRequest) return cachedRequest;

  return caches.match('./index.html').then(fallback => fallback || caches.match('./'));
}

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(URLS_TO_CACHE.map(async url => {
      try {
        const response = await fetch(url, { mode: 'no-cors' });
        await cacheResponse(cache, url, response);
      } catch {
        // Ignore individual failures during install so one bad asset does not block the app shell.
      }
    }));
  })());

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => (cacheName === CACHE_NAME ? null : caches.delete(cacheName)))
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

  const sameOrigin = new URL(request.url).origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cacheResponse(cache, request, response);
        return response;
      } catch {
        return fallbackToAppShell(request);
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    try {
      const response = await fetch(request);

      if (sameOrigin) {
        const cache = await caches.open(CACHE_NAME);
        await cacheResponse(cache, request, response);
      }

      return response;
    } catch {
      return fallbackToAppShell(request);
    }
  })());
});
