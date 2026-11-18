// Service worker: always fetch the latest game files when online (so a new version is never hidden
// behind the browser cache), and fall back to the last downloaded copy when offline.
const CACHE = 'minicraft-files';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // 'no-cache' makes the browser check with the server instead of trusting its HTTP cache
      const res = await fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }));
      if (res.ok) cache.put(req.url, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req.url);
      if (hit) return hit;
      throw err;
    }
  })());
});
