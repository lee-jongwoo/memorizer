const CACHE_NAME = 'v0.1';

self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(['/', '/index.html', '/styles/style.css', '/scripts/app.js', 'texts/']);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
      caches.match(event.request).then((response) => {
          return response || fetch(event.request);
      })
  );
});