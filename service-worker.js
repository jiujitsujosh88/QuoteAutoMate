// Quote AutoMate SW – v8 (cache bump)
const CACHE_VERSION = 'qam-cache-v8';
const CORE_ASSETS = [
  './','./index.html','./app.js','./styles.css','./manifest.json',
  './icon-192.png','./icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(CORE_ASSETS)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k===CACHE_VERSION ? null : caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req=e.request; if(req.method!=='GET') return;
  e.respondWith((async () => {
    const hit = await caches.match(req); if (hit) return hit;
    try{
      const res = await fetch(req); const copy = res.clone();
      (await caches.open(CACHE_VERSION)).put(req, copy);
      return res;
    } catch(_){
      if (req.mode === 'navigate') return caches.match('./index.html');
      throw _;
    }
  })());
});
self.addEventListener('message', (e)=>{ if(e.data?.type==='SKIP_WAITING') self.skipWaiting(); });