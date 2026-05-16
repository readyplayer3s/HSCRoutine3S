// Service Worker - Handles offline caching and request interception
// Caches essential files on first visit, serves cached versions when offline

const CACHE_NAME = 'hsc-routine-v1';

// Files to cache on first install
const URLS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Share+Tech+Mono&family=Barlow:wght@300;400;500&display=swap'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.log('Cache addAll error:', err);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
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

  event.respondWith(
    caches.match(request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request (it can only be used once)
        const fetchRequest = request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response (it can only be used once)
          const responseToCache = response.clone();

          // Cache successful requests for future offline use
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Network error - try to return cached version, otherwise offline fallback
        return caches.match('./index.html').then(resp => resp || caches.match('./'));
      })
  );
});
