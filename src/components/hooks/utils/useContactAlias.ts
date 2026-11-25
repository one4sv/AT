import { useCallback, useSyncExternalStore } from "react";
import { useUser } from "../UserHook";

const eventName = "at-contact-alias";
const subscribe = (listener: () => void) => {
    window.addEventListener(eventName, listener);
    window.addEventListener("storage", listener);
    return () => {
        window.removeEventListener(eventName, listener);
        window.removeEventListener("storage", listener);
    };
};

export default function useContactAlias(contactId?: string) {
    const { user } = useUser();
    const key = user.id && contactId && user.id !== contactId ? "at-contact-alias:" + user.id + ":" + contactId : "";
    const read = useCallback(() => {
        try { return key ? localStorage.getItem(key) || "" : ""; }
        catch { return ""; }
    }, [key]);
    const alias = useSyncExternalStore(subscribe, read, () => "");
    const save = useCallback((value: string) => {
        if (!key) return;
        try {
            if (value.trim()) localStorage.setItem(key, value.trim().slice(0, 40));
            else localStorage.removeItem(key);
            window.dispatchEvent(new Event(eventName));
        } catch { /* storage unavailable */ }
    }, [key]);
    return [alias, save] as const;
}
