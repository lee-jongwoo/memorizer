const cacheName = 'memorizer-v1.0.1';
const appShellFiles = [
  '/index.html', 
  '/styles/style.css', 
  '/styles/shuffler.css', 
  '/scripts/app.js', 
  '/scripts/shuffler.js', 
  '/shuffler.html',
  '/service-worker.js'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const passage_paths = [];
      try {
        const response = await fetch('texts/index.json');
        const passages = await response.json();
        passages.forEach(passage => {
          passage_paths.push('texts/' + passage.file);
        });
      } catch (error) {
        console.error('Error loading passages:', error);
      }
      await cache.addAll(appShellFiles.concat(passage_paths));
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== cacheName) {
            return caches.delete(name);
          }
        })
      );
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      const networkResponse = await fetch(event.request);
      if (event.request.method === 'GET' && networkResponse.ok) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    })()
  );
});
