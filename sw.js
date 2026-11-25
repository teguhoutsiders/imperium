/* Imperium service worker: jaringan dulu, salinan terakhir saat offline. Data tidak disimpan di sini. */
const C="imperium-shell-v37";
const SHELL=["./","index.html","imp-shim.js","manifest.webmanifest","icon-192-v2.png","icon-512-v2.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("imperium-shell-")&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  /* pustaka Supabase dari jsDelivr ikut disimpan agar Imperium tetap terbuka saat offline */
  if(u.origin!==location.origin&&u.hostname!=="cdn.jsdelivr.net")return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
