/* Quote AutoMate – PWA Service Worker (matching index.html + manifest)
   Cache strategy: cache-first for app shell with network fallback for other requests.
*/
const CACHE_NAME = "qam-shell-v3";

// Files to precache (must match what the app needs to run offline)
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  // Activate new SW immediately on next reload if we message SKIP_WAITING
  self.skipWaiting();
});

// Activate: clean up old caches, claim control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Optional: accept a message from the app to skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: cache-first for same-origin requests, network fallback
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET & same-origin
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          // Cache a copy of successful same-origin responses
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          return resp;
        })
        .catch(() => {
          // Offline fallback: if request was “/”, serve shell
          if (req.mode === "navigate" || req.destination === "document") {
            return caches.match("./index.html");
          }
          return new Response("", { status: 503, statusText: "Offline" });
        });
    })
  );
});