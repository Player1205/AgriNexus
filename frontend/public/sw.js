const CACHE_NAME = 'agrinexus-offline-v11';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/models/class_mapping.json',
  '/wasm/ort-wasm-simd-threaded.jsep.mjs',
  '/wasm/ort-wasm-simd-threaded.mjs'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Pre-caching core application shell into', CACHE_NAME);

      // 1. Precache essential static shell assets individually (non-atomic for resilience)
      for (const asset of STATIC_ASSETS) {
        try {
          const res = await fetch(asset);
          if (res && res.ok) {
            await cache.put(asset, res);
          }
        } catch (err) {
          console.warn('[SW] Non-fatal pre-cache warning for static asset:', asset, err);
        }
      }

      // 2. Dynamically discover and precache all linked Vite production bundle assets from /index.html
      try {
        const indexResp = await fetch('/index.html', { cache: 'no-cache' });
        if (indexResp && indexResp.ok) {
          await cache.put('/index.html', indexResp.clone());
          await cache.put('/', indexResp.clone());
          const htmlText = await indexResp.text();

          const bundleUrls = [];
          const scriptMatches = htmlText.matchAll(/src=["'](\/assets\/[^"']+)["']/g);
          for (const m of scriptMatches) {
            bundleUrls.push(m[1]);
          }
          const linkMatches = htmlText.matchAll(/href=["'](\/assets\/[^"']+)["']/g);
          for (const m of linkMatches) {
            bundleUrls.push(m[1]);
          }

          console.log('[SW] Pre-caching discovered Vite bundle assets:', bundleUrls);
          for (const assetUrl of bundleUrls) {
            try {
              const res = await fetch(assetUrl);
              if (res && res.ok) {
                await cache.put(assetUrl, res);
                console.log('[SW] Precached bundle asset:', assetUrl);
              }
            } catch (fetchErr) {
              console.warn('[SW] Could not fetch asset during install:', assetUrl, fetchErr);
            }
          }
        }
      } catch (err) {
        console.warn('[SW] Dynamic bundle discovery warning:', err);
      }

      // 3. Asynchronously pre-cache Edge AI WASM binaries & ONNX model weights without blocking core shell
      const EDGE_AI_ASSETS = [
        '/wasm/ort-wasm-simd-threaded.wasm',
        '/wasm/ort-wasm-simd-threaded.jsep.wasm',
        '/models/agrinexus_vision.onnx',
        '/models/agrinexus_vision.onnx.data'
      ];
      for (const modelUrl of EDGE_AI_ASSETS) {
        try {
          const matched = await cache.match(modelUrl);
          if (!matched) {
            console.log('[SW] Pre-caching Edge AI neural asset:', modelUrl);
            const res = await fetch(modelUrl);
            if (res && res.ok) {
              await cache.put(modelUrl, res);
              console.log('[SW] Successfully cached Edge AI asset:', modelUrl);
            }
          }
        } catch (fetchErr) {
          console.warn('[SW] Non-fatal Edge AI pre-cache fetch warning:', modelUrl, fetchErr);
        }
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // If OFFLINE, DO NOT PURGE OLD CACHES!
      // Purging old caches when offline destroys the user's only copy of the app.
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key.startsWith('agrinexus-offline-')) {
              console.log('[SW] Purging outdated cache in online mode:', key);
              return caches.delete(key);
            }
          })
        );
      } else {
        console.log('[SW] Device is offline; preserving all cached namespaces for offline survival.');
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker for backend API endpoints and WebSockets
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return;
  }

  // 2. NETWORK-FIRST for HTML / Navigation requests with instant offline fallback
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      (async () => {
        // Fast path: if online, try network first
        if (typeof navigator === 'undefined' || navigator.onLine) {
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(event.request, networkResponse.clone());
              cache.put('/index.html', networkResponse.clone());
              cache.put('/', networkResponse.clone());
              return networkResponse;
            }
          } catch (netErr) {
            console.log('[SW] Network navigation fetch failed, falling back to cache');
          }
        }

        // Offline navigation fallback: Check current cache first, then any previous cache
        const cachedIndex = (await caches.match('/index.html')) || (await caches.match('/'));
        if (cachedIndex) return cachedIndex;

        const allCaches = await caches.keys();
        for (const cName of allCaches) {
          const c = await caches.open(cName);
          const match = (await c.match('/index.html')) || (await c.match('/'));
          if (match) return match;
        }

        return new Response('AgriNexus is offline. Please reconnect once to cache the full application.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })()
    );
    return;
  }

  // 3. CACHE-FIRST for versioned static assets (CSS, JS, WASM, models, images)
  event.respondWith(
    (async () => {
      // 1. Check exact match in current cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Try pathname match in current cache
      if (url.pathname) {
        const pathMatch = await caches.match(url.pathname);
        if (pathMatch) return pathMatch;
      }

      // 3. Try network if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const copy = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, copy);
          }
          return networkResponse;
        } catch (fetchErr) {
          console.warn('[SW] Online fetch failed for asset, attempting offline fallbacks:', event.request.url);
        }
      }

      // 4. Resilient Offline Fallback: Search across ALL cache namespaces
      const allCaches = await caches.keys();
      for (const cName of allCaches) {
        const c = await caches.open(cName);
        let match = await c.match(event.request);
        if (!match && url.pathname) {
          match = await c.match(url.pathname);
        }
        if (match) {
          console.log(`[SW] Found asset in older cache '${cName}':`, event.request.url);
          return match;
        }

        // Resilient bundle hash fallback: If index-*.js or index-*.css hash changed while offline,
        // serve the existing cached JS/CSS bundle so the application never dies with an empty 404!
        if (url.pathname.includes('/assets/index-') && url.pathname.endsWith('.js')) {
          const reqs = await c.keys();
          const fallbackJs = reqs.find((r) => {
            const p = new URL(r.url).pathname;
            return p.includes('/assets/index-') && p.endsWith('.js');
          });
          if (fallbackJs) {
            console.log('[SW] Serving fallback cached JS bundle:', fallbackJs.url);
            return c.match(fallbackJs);
          }
        }

        if (url.pathname.includes('/assets/index-') && url.pathname.endsWith('.css')) {
          const reqs = await c.keys();
          const fallbackCss = reqs.find((r) => {
            const p = new URL(r.url).pathname;
            return p.includes('/assets/index-') && p.endsWith('.css');
          });
          if (fallbackCss) {
            console.log('[SW] Serving fallback cached CSS bundle:', fallbackCss.url);
            return c.match(fallbackCss);
          }
        }
      }

      // If truly not found, return 404
      return new Response('', { status: 404, statusText: 'Not Found' });
    })()
  );
});
