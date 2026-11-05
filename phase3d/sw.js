/* AURA STUDY Phase 3D - STAGING-only offline shell service worker.
 * Never cache Supabase, auth sessions, JWTs, third-party CDNs or API responses.
 * Worker scope is ./phase3d/ only (not the rest of the AURA STUDY site).
 */
const CACHE = "aura-study-phase3d-shell-v1";
const ROOT = self.registration.scope;
const ASSETS = [
  "./index.html",
  "./offline-context.js",
  "./resilient-sync.js",
  "../aura_offline_queue_v1.js",
  "../aura_learning_pipeline_v1.js"
].map(path => new URL(path, ROOT).href);
const ALLOWED = new Set(ASSETS);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("aura-study-phase3d-shell-") && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const plain = new URL(url.pathname, self.location.origin).href;
  if (!ALLOWED.has(plain)) return;
  // Exact allowlist is deliberately independent of query parameters; only
  // pre-cached, public static files are handled.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(plain);
    if (cached) return cached;
    return fetch(event.request);
  })());
});
