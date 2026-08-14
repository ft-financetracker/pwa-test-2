const CACHE_NAME = "finance-tracker-v15-1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./ft-logo.png?v=15",
  "./ft-icon-64.png?v=15",
  "./ft-icon-180.png?v=15",
  "./ft-icon-192.png?v=15",
  "./ft-icon-512.png?v=15"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});


// ==========================================
// FETCH
// ==========================================

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  /*
   * Request lintas domain, termasuk JSONP Google Apps Script,
   * tidak dikelola cache Service Worker.
   */
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  /*
   * Halaman utama menggunakan network-first.
   * Versi terbaru dari GitHub Pages akan diprioritaskan.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put("./index.html", copy);
              });
          }

          return response;
        })
        .catch(() => {
          return caches.match("./index.html");
        })
    );

    return;
  }

  /*
   * File statis menggunakan cache-first.
   */
  event.respondWith(
    caches
      .match(request)
      .then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();

              caches
                .open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, copy);
                });
            }

            return response;
          });
      })
  );
});
