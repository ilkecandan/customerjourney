const CACHE_NAME = 'funnelflow-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other critical assets your app needs to work offline
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
