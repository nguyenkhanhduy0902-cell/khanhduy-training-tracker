/* TRUE TRAIN V11.7 — GitHub Pages safe service worker */
const CACHE_PREFIX = 'true-train-';
const CACHE_NAME = 'true-train-v11-7-20260921';

const OPTIONAL_STATIC_ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-48.png'
];

async function cacheOptionalAssets() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    OPTIONAL_STATIC_ASSETS.map(async asset => {
      try {
        const response = await fetch(asset, { cache: 'no-store' });
        if (response && response.ok) await cache.put(asset, response.clone());
      } catch (_) {
        // Optional asset missing/offline: do not block SW installation.
      }
    })
  );
}

self.addEventListener('install', event => {
  event.waitUntil(
    cacheOptionalAssets().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstDocument(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
      const canonicalIndex = new Request(new URL('./index.html', self.registration.scope).href);
      await cache.put(canonicalIndex, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const fallback = await caches.match('./index.html', { ignoreSearch: true });
    if (fallback) return fallback;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await caches.match(request, { ignoreSearch: true });

  const networkPromise = fetch(request, { cache: 'no-store' })
    .then(async response => {
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await networkPromise) || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML/navigation always checks network first so a new GitHub deploy wins.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  // Cache same-origin static resources only. External/API traffic is untouched.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
