// Service Worker for PixCell

const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// List of static assets to precache
const STATIC_ASSETS = [
  '/icons/mail.svg',
  '/icons/phone.svg',
  '/icons/worm.svg',
  // Add more static assets here if needed
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for static assets
  if (STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for dynamic images (Supabase or other known sources)
  if (/\/storage\/v1\/object\/public\//.test(url.pathname)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
          return cached ? Promise.resolve(cached) : fetchPromise;
        })
      )
    );
    return;
  }

  // Default: network
  event.respondWith(fetch(request));
}); 