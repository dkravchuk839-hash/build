const CACHE = 'tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/views.css',
  './js/utils/format.js',
  './js/utils/validate.js',
  './js/utils/dom.js',
  './js/db.js',
  './js/store.js',
  './js/router.js',
  './js/services/geo.js',
  './js/services/photos.js',
  './js/services/export.js',
  './js/services/pdf.js',
  './js/views/settings.js',
  './js/views/dashboard.js',
  './js/views/projects.js',
  './js/views/session-form.js',
  './js/views/travel-form.js',
  './js/views/project-detail.js',
  './js/views/report.js',
  './js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
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
  if (url.hostname === 'nominatim.openstreetmap.org' ||
      url.hostname.includes('jsdelivr') ||
      url.hostname.includes('cdnjs')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
