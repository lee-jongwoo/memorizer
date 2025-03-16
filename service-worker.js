const CACHE_NAME = 'v0.2';

var passage_paths = [];
const response = await fetch('texts/index.json');
const passages = await response.json();
passages.forEach(passage => {
  passage_paths.push('texts' + passage.file);
});

self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(['/', '/index.html', '/styles/style.css', '/scripts/app.js'].concat(passage_paths));
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