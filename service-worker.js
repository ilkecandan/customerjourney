// Service Worker for FunnelFlow - Marketing Funnel Dashboard
const CACHE_NAME = 'funnelflow-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/icon.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/images/offline.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/dragula/3.7.3/dragula.min.css',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dragula/3.7.3/dragula.min.js',
  'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js'
];

// Install Event - Cache all essential resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline page and essential assets');
        return cache.addAll(PRECACHE_URLS)
          .then(() => cache.add(OFFLINE_URL));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to cache it
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For non-API requests: Cache with network fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If the response is good, cache it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request)
          .then(response => {
            // If not found in cache, return offline page for HTML requests
            if (!response && event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            return response;
          });
      })
  );
});

// Background Sync for offline data sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-leads') {
    console.log('[ServiceWorker] Background sync for leads');
    event.waitUntil(syncLeads());
  }
});

// Push Notification Event
self.addEventListener('push', event => {
  const data = event.data.json();
  const title = data.title || 'FunnelFlow Notification';
  const options = {
    body: data.body || 'You have new updates in your marketing funnel',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// Helper function for background sync
function syncLeads() {
  return getPendingLeads()
    .then(pendingLeads => {
      return Promise.all(
        pendingLeads.map(lead => {
          return fetch('/api/leads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(lead)
          })
          .then(response => {
            if (response.ok) {
              return removePendingLead(lead.id);
            }
            throw new Error('Network response was not ok');
          });
        })
      );
    });
}

// Placeholder functions - implement these based on your IndexedDB setup
function getPendingLeads() {
  // Implement logic to get leads from IndexedDB
  return Promise.resolve([]);
}

function removePendingLead(leadId) {
  // Implement logic to remove lead from IndexedDB
  return Promise.resolve();
}
