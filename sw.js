const CACHE = 'protocol-v14';

// Cache everything on first load including CDN
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Local files - required
      return cache.addAll(['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'])
        .then(() => {
          // CDN files - cache if possible (don't fail install if not)
          return Promise.allSettled([
            fetch('https://unpkg.com/react@18/umd/react.production.min.js')
              .then(r => r.ok ? cache.put('https://unpkg.com/react@18/umd/react.production.min.js', r) : null),
            fetch('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js')
              .then(r => r.ok ? cache.put('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', r) : null),
            fetch('https://unpkg.com/@babel/standalone/babel.min.js')
              .then(r => r.ok ? cache.put('https://unpkg.com/@babel/standalone/babel.min.js', r) : null),
          ]);
        });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => {
            try { c.put(e.request, clone); } catch(err) {}
          });
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
