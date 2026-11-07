import { api } from "../api";

export type PushState = {
    supported: boolean;
    configured: boolean;
    subscribed: boolean;
    publicKey: string | null;
};

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalonePWA = () => window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const supportsWebPush = () =>
    window.isSecureContext && "serviceWorker" in navigator &&
    "PushManager" in window && "Notification" in window &&
    (!isIOS() || isStandalonePWA());

function decodePublicKey(base64url: string): Uint8Array<ArrayBuffer> {
    const source = atob(base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - base64url.length % 4) % 4));
    return Uint8Array.from(source, char => char.charCodeAt(0));
}

export async function getPushState(): Promise<PushState> {
    const supported = supportsWebPush();
    const { data } = await api.get("push/config");
    const state: PushState = { supported, configured: data?.enabled === true, subscribed: false, publicKey: data?.publicKey ?? null };
    if (!supported || Notification.permission !== "granted") return state;

    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
        const response = await api.get("push/status", { params: { endpoint: subscription.endpoint } });
        state.subscribed = response.data?.subscribed === true;
    }
    return state;
}

export async function enableWebPush(publicKey: string | null) {
    if (!supportsWebPush()) throw new Error("unsupported");
    if (!publicKey) throw new Error("unconfigured");
    // Permission must be requested directly from the user's click/tap.
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") throw new Error(permission);

    const registration = await navigator.serviceWorker.register("/at-wallpaper-cache-sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const applicationServerKey = decodePublicKey(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        const currentKey = subscription.options.applicationServerKey;
        if (currentKey && !Uint8Array.from(new Uint8Array(currentKey)).every((value, index) => value === applicationServerKey[index])) {
            await api.post("push/unsubscribe", { endpoint: subscription.endpoint });
            await subscription.unsubscribe();
            subscription = null;
        }
    }

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    }

    try {
        await api.post("push/subscribe", { subscription: subscription.toJSON() });
    } catch (error) {
        // If the backend is unavailable, do not leave a locally subscribed but unknown endpoint.
        await subscription.unsubscribe();
        throw error;
    }
}

export async function disableWebPush() {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await api.post("push/unsubscribe", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
}
