const CACHE = "at-public-wallpapers-v1";
const DISABLED = "at-public-wallpapers-cache-disabled";
const LIMIT = 12;
let enabled = true;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("message", event => {
    if (event.data?.type !== "AT_WALLPAPER_CACHE") return;
    enabled = event.data.enabled === true;
    event.waitUntil((async () => {
        if (enabled) {
            await caches.delete(DISABLED);
        } else {
            await caches.open(DISABLED);
            await caches.delete(CACHE);
        }
    })());
});
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith("/wallpapers/") ||
        !/\.(svg|webp|png|jpe?g)$/i.test(url.pathname)) return;

    event.respondWith((async () => {
        if (!enabled || await caches.has(DISABLED)) return fetch(event.request);
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

self.addEventListener("push", event => {
    event.waitUntil((async () => {
        let payload = {};
        try {
            payload = event.data?.json() ?? {};
        } catch {
            payload = { body: event.data?.text() ?? "" };
        }
        // Safari requires an immediately visible notification for every received push.
        const title = String(payload.title || "AchieveTogether").slice(0, 120);
        const body = String(payload.body || "").slice(0, 200);
        const candidate = String(payload.url || "/");
        const target = new URL(candidate, self.location.origin);
        const url = target.origin === self.location.origin && /^\/(chat|habit)(\/|$)/.test(target.pathname)
            ? target.pathname + target.search : "/";
        await self.registration.showNotification(title, {
            body,
            icon: "/favicon.png",
            badge: "/favicon.png",
            tag: String(payload.tag || "").slice(0, 100),
            data: { url, messageId: payload.messageId }
        });
    })());
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    const destination = new URL(event.notification.data?.url || "/", self.location.origin);
    if (destination.origin !== self.location.origin) return;
    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of windows) {
            if (new URL(client.url).origin === destination.origin) {
                await client.navigate(destination.href);
                return client.focus();
            }
        }
        return self.clients.openWindow(destination.href);
    })());
});
