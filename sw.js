const CACHE_NAME = 'khanhduy-training-v5-1-cloud-1';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Supabase/API requests must stay network-only so stale auth/data is never cached by the service worker.
  if (url.hostname.includes('supabase.co')) return;
  event.respondWith(fetch(event.request).then(response => { const clone=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,clone)); return response; }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))));
});
