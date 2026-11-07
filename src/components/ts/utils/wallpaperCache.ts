const script = "/at-wallpaper-cache-sw.js";
const cacheName = "at-public-wallpapers-v1";

export async function configureWallpaperCache(enabled: boolean) {
    if (!("serviceWorker" in navigator) || !("caches" in window) || !window.isSecureContext) return;

    try {
        // Push notifications share this root-scope worker. Disabling wallpaper caching
        // must not unregister it or break background notifications.
        const registration = await navigator.serviceWorker.register(script, { scope: "/" });
        (registration.active ?? registration.waiting ?? registration.installing)?.postMessage({
            type: "AT_WALLPAPER_CACHE", enabled
        });
        if (!enabled) await caches.delete(cacheName);
    } catch (error) {
        console.warn("Wallpaper caching unavailable:", error);
    }
}
