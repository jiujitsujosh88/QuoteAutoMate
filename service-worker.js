/* Quote AutoMate – Service Worker (cache-first) */
const // Quote AutoMate SW – v7
const CACHE_VERSION = 'qam-cache-v7';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',       // (exists or 404s gracefully)
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      const copy = res.clone();
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, copy);
      return res;
    } catch (_) {
      // offline & not cached: try index for navigation requests
      if (req.mode === 'navigate') {
        return caches.match('./index.html');
      }
      throw _;
    }
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
}); = 'qam-cache-v0.2.7'; // bump this when files change
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_VERSION) ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

self.addEventListener('message', (event)=>{
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Cache-first for same-origin GET
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (fresh && (req.mode === 'navigate' || ['document','script','style','image'].includes(req.destination))) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      if (req.mode === 'navigate') return cache.match('./index.html');
      throw e;
    }
  })());
});