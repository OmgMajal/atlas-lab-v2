/* Atlas PWA shell. Browser data stays local; this worker never simulates server sync. */
var CACHE = 'atlas-shell-v2.3.0';
var SHELL = ['/', '/index.html', '/offline.html', '/styles.css', '/atlas-deployment.js', '/app.js', '/manifest.webmanifest', '/icons/atlas-192.svg', '/icons/atlas-512.svg'];
self.addEventListener('install', function (event) { event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (event) { event.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(function (cached) {
    var request = event.request;
    return cached || fetch(request).then(function (response) {
      if (response && response.ok && new URL(request.url).origin === self.location.origin) {
        var copy = response.clone(); caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    }).catch(function () { return caches.match('/offline.html'); });
  }));
});
