// Use relative URLs so it works under GitHub Pages repo path
const CACHE_NAME = "qam-v3";
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle GET
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(resp => {
        // Optionally cache new navigations/assets
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, respClone)).catch(()=>{});
        return resp;
      }).catch(() => {
        // Offline fallback (optional): return cached shell
        if (request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});