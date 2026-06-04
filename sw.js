/* PRISM Service Worker — cache-first, silent background update */
const CACHE = 'prism-1780596836';

const PRECACHE = [
  '/',
  '/index.html',
  '/js/lib/echarts.min.js',
  '/js/lib/fuse.min.js',
  '/js/js/state.js',
  '/js/js/i18n.js',
  '/js/js/ui.js',
  '/js/js/tab_overview.js',
  '/js/js/tab_country.js',
  '/js/js/tab_compare.js',
  '/js/js/tab_evolution.js',
  '/js/js/tab_changes.js',
  '/js/js/tab_sectors.js',
  '/js/js/search.js',
  '/js/js/ai.js',
  '/js/js/main.js',
  '/js/js/screener.js',
  '/data/world.json',
  '/data/policy_texts.json',
  '/data/search_index.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // 不缓存外部资源（如 Google Fonts）

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => null);
      return cached || fresh;
    })
  );
});
