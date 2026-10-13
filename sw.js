/* TRUE TRAIN service worker. Cache name đổi theo mỗi bản để máy cũ tự bỏ cache cũ.
   Khi phát hành: tên cache phải khớp APP_VERSION trong index.html (16.8.1 -> v16-8-1). */
const CACHE = 'true-train-v16-8-1-release-1';
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

/* Network trước, cache dự phòng: mở app ngoại tuyến vẫn chạy, có mạng thì luôn lấy bản mới, bỏ qua HTTP cache của GitHub Pages. Không đụng request tới server khác (Supabase).
   16.8: version.json và version-test.json luôn đi thẳng mạng, không lưu cache, để cờ bảo trì hoặc bắt buộc không bị kẹt bản cũ khi mất mạng.
   16.8: chỉ trả index.html dự phòng khi mở trang (navigate). File khác không có trong cache thì trả lỗi mạng, không trả nhầm HTML. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\/version(-test)?\.json$/.test(url.pathname)) return;
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
