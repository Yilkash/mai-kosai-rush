// Keeps the game playable offline after the first visit.
// Scoped to /mai-kosai-rush/ only: the other apps on yilkash.github.io are not touched.
const CACHE = 'mai-kosai-rush-v3';
const FILES = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/main.js', './js/textures.js', './js/sky.js', './js/util.js', './js/world.js',
  './js/people.js', './js/cast.js', './js/audio.js', './js/vendor/three.module.min.js',
  './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('mai-kosai-rush-') && k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Network first so updates arrive; the cache answers when there is no signal.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request)));
});
