const CACHE='true-train-v8.6.1';
const CORE=["./", "./index.html", "./manifest.webmanifest", "./true-train-logo.png", "./icons/icon-192.png", "./icons/icon-512.png", "./assets/v86/coach-tdee.jpg", "./assets/v86/coach-macro.jpg", "./assets/v86/coach-nutrition.jpg", "./assets/v86/coach-exercise.jpg", "./assets/v86/coach-muscle.jpg", "./assets/v86/machine-chest-press.jpg"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin) return;
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>cached)));
});
