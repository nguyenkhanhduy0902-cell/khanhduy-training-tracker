/* TRUE TRAIN service worker 16.9: GHIM PHIÊN BẢN.
   Ý tưởng: mỗi máy "ghim" một bản index.html đã lưu trong cache. Admin đẩy code mới lên repo
   thì máy khách chỉ TẢI SẴN bản mới vào cache riêng, vẫn chạy bản đang ghim.
   Máy chỉ đổi sang bản mới khi người dùng bấm "Cập nhật" (trang gửi lệnh TT_PIN).

   Khi phát hành: VERSION phải khớp APP_VERSION trong index.html (16.32 -> '16.32').
   Nếu index.html tải về chưa khớp VERSION (GitHub Pages chưa cập nhật xong), cài đặt thất bại,
   máy giữ nguyên service worker và bản cũ, trình duyệt tự thử lại lần sau.

   Giao thức với trang (phải giữ tương thích ở các bản sau, vì service worker mới có thể phục vụ trang cũ):
   - {type:'TT_STATUS'} -> {version, pinned}
   - {type:'TT_PIN'}    -> ghim bản của service worker này, xóa cache cũ -> {ok, version} */
const VERSION = '16.61';
const CACHE = 'true-train-v16-45';
const META = 'true-train-meta';
const PIN_KEY = './__tt_pinned__';
const SCOPE = self.registration.scope;
const INDEX_URL = new URL('./index.html', SCOPE).href;
const VERSION_RE = /const APP_VERSION\s*=\s*'([^']+)'/;

async function readPin() {
  try {
    const meta = await caches.open(META);
    const res = await meta.match(PIN_KEY);
    if (!res) return null;
    const pin = await res.json();
    return pin && typeof pin.cache === 'string' && pin.cache.startsWith('true-train-v') ? pin : null;
  } catch (_) { return null; }
}
async function writePin(cache, version) {
  const meta = await caches.open(META);
  await meta.put(PIN_KEY, new Response(JSON.stringify({ cache, version, at: Date.now() }), { headers: { 'Content-Type': 'application/json' } }));
}
/* Xóa mọi cache bản cũ, chỉ giữ: cache đang ghim, cache của service worker này, và META. */
async function cleanup(keep) {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k.startsWith('true-train-') && k !== META && !keep.includes(k)).map(k => caches.delete(k)));
}

/* Tải index.html đúng bản VERSION vào cache riêng. Thử tối đa 3 lần vì CDN GitHub Pages có thể trễ vài phút. */
async function precache() {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${INDEX_URL}?sw=${encodeURIComponent(VERSION)}&t=${Date.now()}`, { cache: 'no-store' });
      if (!res || !res.ok) throw new Error('index.html HTTP ' + (res && res.status));
      const found = ((await res.clone().text()).match(VERSION_RE) || [])[1] || '';
      if (found !== VERSION) throw new Error(`index.html trên server là ${found || '?'}, service worker là ${VERSION}`);
      const cache = await caches.open(CACHE);
      await cache.put(INDEX_URL, res);
      return;
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastError || new Error('Không tải được index.html');
}

self.addEventListener('install', event => {
  /* Service worker chỉ phục vụ file, không chứa giao diện, nên kích hoạt ngay là an toàn: bản đang ghim vẫn giữ nguyên. */
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    let pin = await readPin();
    /* Máy chưa từng ghim (lần cài đầu, hoặc đi lên từ 16.8.x): ghim bản này. */
    if (!pin) { await writePin(CACHE, VERSION); pin = { cache: CACHE, version: VERSION }; }
    await cleanup([pin.cache, CACHE]);
    await self.clients.claim();
  })());
});

/* Lấy index.html để mở app: ưu tiên bản đang ghim. Mất bản ghim (trình duyệt dọn bộ nhớ) thì dùng bản mới nhất đã tải và ghim lại. */
async function serveApp(req) {
  const pin = await readPin();
  if (pin) {
    const hit = await caches.open(pin.cache).then(c => c.match(INDEX_URL)).catch(() => null);
    if (hit) return hit;
  }
  const own = await caches.open(CACHE).then(c => c.match(INDEX_URL)).catch(() => null);
  if (own) {
    if (!pin || pin.cache !== CACHE) { try { await writePin(CACHE, VERSION); } catch (_) {} }
    return own;
  }
  /* Không có cache nào: lấy từ mạng như bản cũ. */
  return fetch(req, { cache: 'no-store' }).catch(() => Response.error());
}

function isAppPage(url) {
  if (!url.href.startsWith(SCOPE)) return false;
  const rest = url.pathname.slice(new URL(SCOPE).pathname.length);
  return rest === '' || rest === 'index.html';
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* 16.53 · Model 3D (body.glb, three.js, draco) từ CDN: lưu cache riêng. Từ 16.58 chỉ còn Muscle Map Coach desktop dùng; mobile dùng 2.5D ./mm/body.jpg. */
  if (/^(cdn\.jsdelivr\.net|esm\.sh|www\.gstatic\.com)$/.test(url.hostname) && /body\.glb|three@0\.160|draco|\/v\d+\/three/.test(url.href)) {
    event.respondWith(caches.open('tt-3d-v1').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()).catch(() => {}); return res; }))));
    return;
  }
  if (url.origin !== self.location.origin) return; /* Không đụng Supabase hay server khác. */
  if (/\/version(-test)?\.json$/.test(url.pathname)) return; /* Cờ phát hành luôn đi thẳng mạng. */
  if (/\/sw\.js$/.test(url.pathname)) return;
  if (url.searchParams.has('sw')) return; /* Lệnh tải sẵn của chính service worker. */
  if (req.mode === 'navigate' || isAppPage(url)) {
    if (isAppPage(url)) { event.respondWith(serveApp(req)); return; }
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(INDEX_URL).then(hit => hit || Response.error())));
    return;
  }
  /* File phụ (icon, manifest): mạng trước, cache dự phòng. */
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || Response.error()))
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  const reply = msg => { try { (event.ports && event.ports[0] ? event.ports[0] : event.source).postMessage(msg); } catch (_) {} };
  if (data.type === 'TT_STATUS') {
    event.waitUntil(readPin().then(pin => reply({ type: 'TT_STATUS', version: VERSION, pinned: pin ? pin.version : '' })));
  } else if (data.type === 'TT_PIN') {
    event.waitUntil((async () => {
      try {
        const ready = await caches.open(CACHE).then(c => c.match(INDEX_URL));
        if (!ready) await precache();
        await writePin(CACHE, VERSION);
        await cleanup([CACHE]);
        reply({ type: 'TT_PIN', ok: true, version: VERSION });
      } catch (e) {
        reply({ type: 'TT_PIN', ok: false, version: VERSION, error: String(e && e.message || e) });
      }
    })());
  }
});
