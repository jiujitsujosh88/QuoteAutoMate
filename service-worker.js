/* service-worker.js — QAM skeleton robust SW for GitHub Pages */
const VERSION = 'qam-v7';
const SCOPE = self.registration.scope; // e.g. https://<user>.github.io/QuoteAutoMate/
const toAbs = (p) => new URL(p, SCOPE).toString();

const ASSETS = [
  toAbs('./'),
  toAbs('./index.html'),
  toAbs('./manifest.json'),
  toAbs('./icons/icon-192.png'),
  toAbs('./icons/icon-512.png')
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === VERSION ? null : caches.delete(k))))
    )
  );
  self.clients.claim(); // control existing clients
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = accept.includes('text/html');

  if (isHTML) {
    // Network-first for documents, fallback to cache (or root)
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(r => r || caches.match(toAbs('./')))
        )
    );
  } else {
    // Cache-first for static
    event.respondWith(
      caches.match(req).then(r => r || fetch(req))
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});