
<!-- Service Worker -->
<script>
const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
    '/user.html',
  '/4/styles.css',
  '/4/w3.css',
  '/script.js',
  '/val.js',
  '/cont.js',
  '/manifest.json',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png'
];

// Install the service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});
