const CACHE = 'protocol-v16';
const BASE = '/protokol';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll([
        BASE + '/',
        BASE + '/index.html',
        BASE + '/manifest.json',
        BASE + '/icon-192.png',
        BASE + '/icon-512.png'
      ]).then(() => {
        return Promise.allSettled([
          fetch('https://unpkg.com/react@18/umd/react.production.min.js')
            .then(r => r.ok ? cache.put('https://unpkg.com/react@18/umd/react.production.min.js', r) : null),
          fetch('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js')
            .then(r => r.ok ? cache.put('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js', r) : null),
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
      }).catch(() => caches.match(BASE + '/index.html'));
    })
  );
});
