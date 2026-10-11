/* TRUE TRAIN service worker. Cache name đổi theo mỗi bản để máy cũ tự bỏ cache cũ. */
const CACHE = 'true-train-v16-4-master-ui-1';
const CORE = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('true-train-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network trước, cache dự phòng: mở app ngoại tuyến vẫn chạy, có mạng thì luôn lấy bản mới, bỏ qua HTTP cache của GitHub Pages. Không đụng request tới server khác (Supabase). */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
