const script = "/at-wallpaper-cache-sw.js";
const cacheName = "at-public-wallpapers-v1";

export async function configureWallpaperCache(enabled: boolean) {
    if (!("serviceWorker" in navigator) || !("caches" in window) || !window.isSecureContext) return;

    try {
        if (enabled) {
            const registration = await navigator.serviceWorker.register(script, { scope: "/" });
            (registration.active ?? registration.waiting ?? registration.installing)?.postMessage({ type: "AT_WALLPAPER_CACHE", enabled: true });
        } else {
            const registration = await navigator.serviceWorker.getRegistration("/");
            const worker = registration?.active ?? registration?.waiting ?? registration?.installing;
            if (worker?.scriptURL.endsWith(script)) {
                worker.postMessage({ type: "AT_WALLPAPER_CACHE", enabled: false });
                await registration?.unregister();
            }
            await caches.delete(cacheName);
        }
    } catch (error) {
        console.warn("Wallpaper caching unavailable:", error);
    }
}
