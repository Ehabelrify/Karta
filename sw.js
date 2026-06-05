const CACHE = 'karta-p8';

// Shell must all cache or the SW won't install — these are required to run the app.
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './core/srs.js',
  './core/languages.js',
  './core/app.js',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
];

// Vocabulary data — large files cached best-effort; a miss falls through to network.
const DATA = [
  './languages/german/a1.json',
  './languages/german/a2.json',
  './languages/german/b1.json',
  './languages/german/b2.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL)
        .then(() => Promise.allSettled(DATA.map(url => c.add(url))))
      )
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
