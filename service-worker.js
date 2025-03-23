const CACHE_NAME = 'v0.4';

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
      await cache.addAll(['/', '/index.html', '/styles/style.css', '/styles/shuffler.css', '/scripts/app.js', '/scripts/shuffler.js', '/shuffler.html'].concat(passage_paths));
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});