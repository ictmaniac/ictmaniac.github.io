// Offline cache for the stamp tool. Bump V when files change.
var V = 'stamp-v1';
var FILES = ['./', 'index.html', 'pdf-lib.min.js', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'f/anek-bn-600.woff2', 'f/anek-lat-600.woff2', 'f/anek-bn-800.woff2', 'f/anek-lat-800.woff2', '../../img/logo.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== V; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
// network first (so updates arrive), cache when offline
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(V).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
