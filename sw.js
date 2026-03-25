// Service Worker: simple cache-first strategy for images
const CACHE_NAME = 'h5games-images-v1';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  try{
    const req = event.request;
    const url = new URL(req.url);
    if (req.destination === 'image' || url.pathname.indexOf('/assets/games/img/') !== -1) {
      event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(req).then(resp => resp || fetch(req).then(networkResp => { try{ cache.put(req, networkResp.clone()); }catch(e){} return networkResp; }))));
    }
  }catch(e){}
});
