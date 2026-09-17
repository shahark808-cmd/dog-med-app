// Service worker בסיסי — רק כדי שאפשר יהיה להתקין את האתר למסך הבית.
// בלי אסטרטגיית קאשינג מורכבת, בכוונה (לא נדרש יותר מזה כרגע).
const CACHE_NAME = 'dogmeds-v1';
const APP_SHELL = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
