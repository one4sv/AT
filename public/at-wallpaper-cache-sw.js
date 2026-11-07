const CACHE = "at-public-wallpapers-v1";
const LIMIT = 12;
let enabled = true;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("message", event => {
    if (event.data?.type !== "AT_WALLPAPER_CACHE") return;
    enabled = event.data.enabled === true;
    if (!enabled) event.waitUntil(caches.delete(CACHE));
});
self.addEventListener("fetch", event => {
    if (!enabled || event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith("/wallpapers/") ||
        !/\.(svg|webp|png|jpe?g)$/i.test(url.pathname)) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        // Keep the latest original through HTTP caching, retaining a bounded offline fallback.
        try {
            const response = await fetch(event.request);
            if (response.ok && response.type === "basic" && response.headers.get("content-type")?.startsWith("image/")) {
                try {
                    await cache.put(event.request, response.clone());
                    const keys = await cache.keys();
                    if (keys.length > LIMIT) await cache.delete(keys[0]);
                } catch {
                    // A full or unavailable CacheStorage must never break online images.
                }
            }
            return response;
        } catch {
            return (await cache.match(event.request)) ?? Response.error();
        }
    })());
});
