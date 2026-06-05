const CACHE = 'karta-p6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './core/srs.js',
  './core/languages.js',
  './core/app.js',
  './languages/german/a1.json',
  './languages/german/a2.json',
  './languages/german/b1.json',
  './languages/german/b2.json',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // allSettled instead of addAll so a single slow/failed asset on a poor
      // mobile connection doesn't abort the entire cache installation.
      .then(c => Promise.allSettled(ASSETS.map(url => c.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
  );
});
