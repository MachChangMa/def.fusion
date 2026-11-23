importScripts('./fusion-cache.js');
const {base, games, files, prefix, name, url} = FusionCache;
const allowed = new Set(files);
const bundled = new Set(games);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(name);
    await cache.addAll(files.map(path => new Request(url(path), {cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== name &&
      !key.slice(prefix.length).includes(':')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const target = new URL(request.url);
  if (request.method !== 'GET' || target.origin !== base.origin ||
      !target.pathname.startsWith(base.pathname) || request.headers.has('range')) return;
  const relative = target.pathname.slice(base.pathname.length);
  const path = relative === '' && request.mode === 'navigate' ? 'index.html' : relative;
  if (!allowed.has(path) || target.search) return;
  event.respondWith((async () => {
    const cache = await caches.open(name);
    const key = url(path);
    const saved = await cache.match(key);
    if (bundled.has(path) && saved) return saved;
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected) {
        try { await cache.put(key, response.clone()); } catch {}
      }
      return response.status >= 500 && saved ? saved : response;
    } catch {
      return saved || Response.error();
    }
  })());
});
