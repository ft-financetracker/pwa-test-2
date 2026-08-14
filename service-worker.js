const CACHE_NAME = "finance-tracker-v8-1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png?v=8",
  "./icon-512.png?v=8"
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

  // Request lintas domain, termasuk JSONP Google Apps Script,
  // berjalan langsung melalui browser dan tidak dikelola cache PWA.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Halaman utama memakai network-first agar index.html terbaru
  // segera terlihat setelah deployment GitHub Pages.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put("./index.html", copy));
          }

          return response;
        })
        .catch(() =>
          caches.match("./index.html")
        )
    );

    return;
  }

  // File statis menggunakan cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy));
        }

        return response;
      });
    })
  );
});
