/* Quote AutoMate – PWA Service Worker */
const CACHE_NAME = "qam-shell-v4";
const PRECACHE = ["./","./index.html","./manifest.json","./icons/icon-192.png","./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c)=>c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message",(event)=>{
  if(event.data && event.data.type==="SKIP_WAITING"){ self.skipWaiting(); }
});

self.addEventListener("fetch",(event)=>{
  const req = event.request;
  if(req.method!=="GET") return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c=>c.put(req,copy));
        return resp;
      }).catch(()=>{
        if(req.mode==="navigate" || req.destination==="document"){
          return caches.match("./index.html");
        }
        return new Response("",{status:503,statusText:"Offline"});
      });
    })
  );
});