const CACHE_NAME = 'true-train-master-v8.4.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './true-train-logo.png',
  './assets/exercises/movement/flat-barbell-bench-press.webp',
  './assets/exercises/movement/incline-db-press.webp',
  './assets/exercises/movement/chest-supported-row.webp',
  './assets/exercises/movement/lat-pulldown.webp',
  './assets/exercises/movement/overhead-press.webp',
  './assets/exercises/movement/lateral-raise.webp',
  './assets/exercises/movement/triceps-pushdown.webp',
  './assets/exercises/movement/squat.webp',
  './assets/exercises/movement/leg-press.webp',
  './assets/exercises/movement/romanian-deadlift.webp',
  './assets/exercises/movement/leg-curl.webp',
  './assets/schedule/full.svg',
  './assets/schedule/upper.svg',
  './assets/schedule/lower.svg',
  './assets/schedule/rest.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Never intercept Supabase/auth/API requests or any cross-origin request.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // HTML/navigation: network first so deployed updates appear quickly on mobile/PWA.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, {cache:'no-store'});
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Static same-origin assets: cache first, then refresh in background.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(async fresh => {
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    return (await network) || Response.error();
  })());
});
