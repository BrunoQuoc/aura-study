/* AURA STUDY legacy Service Worker cleanup.
   Authentication and offline cache were removed when the app split into
   direct Student/Admin links. Any old registration should clear its caches
   and unregister itself so stale login screens cannot return. */
self.addEventListener('install',event=>{
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(key=>caches.delete(key)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
