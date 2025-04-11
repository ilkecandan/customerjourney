// service-worker.js
const CACHE_NAME = 'v1';
const START_URL = '/';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(START_URL))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(START_URL))
  );
});
