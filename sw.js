// --- START OF FILE sw.js ---

const VERSION = '1.0.0'; // Updated version for LogReel Pro
const APP_PREFIX = 'logreelpro'; // Unique prefix for this app's caches
const CACHE_NAME = `${APP_PREFIX}-cache-${VERSION}`;

// IMPORTANT: Ensure this list accurately reflects your file structure and main entry point.
// If your indexLGOkv26.2.html is served as the root, './' is fine.
// If it's served specifically by its name, list that name.
// For consistency, it's often best to rename your main HTML to 'index.html'.
// I'll assume you'll either rename indexLGOkv26.2.html to index.html,
// or your server serves indexLGOkv26.2.html when '/' is requested.
const STATIC_CACHE_URLS = [
  './', // Caches the root. If indexLGOkv26.2.html is your root, this caches it.
  './index.html', // Or './indexLGOkv26.2.html' if you don't rename it.
  './manifest.json', // Add your PWA manifest file
  './icon-192x192.png', // Add your PWA icons
  './icon-512x512.png', // Add your PWA icons
  // Add any other essential static app shell icons/assets if they are not inlined
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', // Google Font CSS
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[Service Worker] Installing: Caching App Shell for version ${VERSION}`);
        // Add all static URLs. If any fail, install fails, which is usually desired.
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches specific to this app (matching APP_PREFIX)
          // but not the current active one.
          if (cacheName.startsWith(`${APP_PREFIX}-cache-`) && cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Activating: Deleting old cache ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated and old caches cleaned.');
      // Tell the active service worker to take control of the page immediately.
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // Let the browser handle requests for範囲拡張など、ブラウザ内部のリクエストは無視
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the request is in the cache, return the cached response.
        if (cachedResponse) {
          // console.log(`[Service Worker] Fetch: Returning ${event.request.url} from cache.`);
          return cachedResponse;
        }

        // If the request is not in the cache, fetch it from the network.
        // console.log(`[Service Worker] Fetch: ${event.request.url} not in cache, fetching from network.`);
        return fetch(event.request).then(
          fetchResponse => {
            // Check if we received a valid response
            // We only cache 'basic' type requests (same-origin or CORS) and 200 status.
            // This prevents caching opaque responses (e.g., from CDNs without CORS) or errors.
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // console.log(`[Service Worker] Fetch: Caching new resource ${event.request.url}`);
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          }
        ).catch(() => {
          // If the network request fails (e.g., user is offline):
          // For navigation requests, fall back to the main index.html (app shell).
          // This is crucial for SPAs to work offline.
          if (event.request.mode === 'navigate') {
            console.log('[Service Worker] Fetch: Navigate request failed, returning offline page.');
            // Adjust './index.html' if your main HTML file has a different name/path
            return caches.match('./index.html');
          }
          // For other types of requests (images, APIs not handled by app logic),
          // they will fail if not cached and network is unavailable.
          // You could provide generic fallbacks here if needed.
        });
      })
  );
});

// Background Sync (placeholder - your app is client-side heavy with IndexedDB,
// so this might be for future features like syncing to a server)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-logreel-data') { // Example tag
    console.log('[Service Worker] Background sync event triggered for:', event.tag);
    // event.waitUntil(syncLogReelDataToServer()); // Implement your sync logic
  }
});

/*
async function syncLogReelDataToServer() {
  // This is where you would:
  // 1. Read data from IndexedDB.
  // 2. Send it to a server API.
  // 3. Handle server responses and potentially update IndexedDB.
  console.log('[Service Worker] Syncing LogReel data...');
  // Remember to use the correct API endpoint.
  // Example:
  // const data = await app.DataManager.getAllDataForSync(); // Hypothetical function
  // await fetch('/api/sync-data', {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  //   headers: {'Content-Type': 'application/json'}
  // });
}
*/

// --- END OF FILE sw.js ---
