import { useEffect } from "react";
import { useUser } from "../hooks/UserHook";
import { enableWebPush, getPushState, supportsWebPush } from "./utils/webPush";

// A granted browser permission enables Push automatically for the signed-in account.
// Browsers do not allow requesting that permission without a user gesture.
export default function AutoWebPush() {
    const { user, initialLoading } = useUser();

    useEffect(() => {
        if (initialLoading || !user.id || !supportsWebPush() || Notification.permission !== "granted") return;
        let mounted = true;
        let syncing = false;
        const sync = async () => {
            if (syncing || !mounted || Notification.permission !== "granted") return;
            syncing = true;
            try {
                const state = await getPushState();
                if (mounted && state.supported && state.configured && !state.subscribed)
                    await enableWebPush(state.publicKey);
            } catch (error) {
                console.error("Push subscription sync failed:", error);
            } finally {
                syncing = false;
            }
        };
        const onVisibility = () => { if (!document.hidden) void sync(); };
        const onFocus = () => { void sync(); };
        void sync();
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            mounted = false;
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [user.id, initialLoading]);

    return null;
}
