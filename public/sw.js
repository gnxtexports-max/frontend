// Service Worker for caching static assets and handling client-side SPA navigation offline.
const CACHE_NAME = "gnxt-static-assets-v2"; // bump to clear old cache

const SW_VERSION = 3; // Bump to force re-install and clear old caches

// Simple install event
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing service worker (v" + SW_VERSION + ")...");
  self.skipWaiting();
});

// Activate event (clean up old caches)
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests for static assets and HTML shell
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass API requests (let global fetch patch in main.jsx handle caching/offline CRUD)
  if (url.pathname.includes("/api/") || url.host.includes("localhost:5000") || url.host.includes("127.0.0.1:5000")) {
    return;
  }

  // Bypass Chrome Extensions, Hot Module Replacement, or websocket connections
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // SPA navigation handling: If the browser requests a navigation (page reload on a router sub-path),
  // we try network first, then fall back to the cached "/" root (index.html)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful 200 responses — never cache 404/500 pages
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("/", clone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, serve the cached "/" root (which is index.html)
          return caches.match("/").then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback error message if nothing is cached
            return new Response("Offline mode active, but index shell is not cached yet. Please connect to the internet and reload.", {
              status: 503,
              headers: { "Content-Type": "text/html" }
            });
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, icons, fonts) - Stale-While-Revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn("[Service Worker] Fetch failed, serving cached static resource:", request.url);
          // If offline and request fails, caches.match resolves to cachedResponse anyway
        });

      return cachedResponse || fetchPromise;
    })
  );
});
