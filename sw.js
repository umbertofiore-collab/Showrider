const CACHE = 'showrider-v1';
const ASSETS = [
  '/Showrider/',
  '/Showrider/index.html',
  '/Showrider/manifest.json',
  '/Showrider/assets/icon_512.png',
  '/Showrider/assets/icon_256.png',
  '/Showrider/assets/icon_128.png',
  '/Showrider/assets/lcc-logo.png',
  'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js'
];

// Installa: metti tutto in cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Attiva: cancella cache vecchie
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: prima cache, poi rete (offline-first)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/Showrider/index.html'));
    })
  );
});
