export type CookiePreference = "necessary" | "all";

export const cookieConsentEvent = "at-cookie-consent-changed";
export const cookieConsentOpenEvent = "at-cookie-consent-open";
const storageKey = "at-cookie-consent-v1";

export function getCookiePreference(): CookiePreference | null {
    try {
        const saved = localStorage.getItem(storageKey);
        return saved === "necessary" || saved === "all" ? saved : null;
    } catch {
        return null;
    }
}

export function saveCookiePreference(value: CookiePreference) {
    try {
        localStorage.setItem(storageKey, value);
    } catch {
        // If storage is disabled, the choice cannot survive a new visit.
    }
    window.dispatchEvent(new Event(cookieConsentEvent));
}

export function openCookiePreferences() {
    window.dispatchEvent(new Event(cookieConsentOpenEvent));
}
