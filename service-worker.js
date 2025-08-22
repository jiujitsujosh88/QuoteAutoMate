/* Quote AutoMate SW — v1.0.0-baseline */
const CACHE_VERSION = 'qam-v1.0.0-baseline';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async ()=>{
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_VERSION ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async ()=>{
    // Try cache first
    const cached = await caches.match(req);
    if (cached) return cached;
    // Then network, and cache opportunistically
    try{
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, fresh.clone());
      return fresh;
    }catch(_){
      // If offline and request is for root, serve index
      if (req.mode === 'navigate') {
        const index = await caches.match('./index.html');
        if (index) return index;
      }
      throw _;
    }
  })());
});

// Handle manual cache-bust
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});