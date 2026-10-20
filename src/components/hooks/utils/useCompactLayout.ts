import { useSyncExternalStore } from "react";
import { isMobile } from "react-device-detect";

const media = typeof window !== "undefined" ? window.matchMedia("(max-width: 800px)") : null;
const subscribe = (listener: () => void) => {
    media?.addEventListener("change", listener);
    return () => media?.removeEventListener("change", listener);
};
const snapshot = () => media?.matches ?? false;
const serverSnapshot = () => false;

export default function useCompactLayout() {
    return useSyncExternalStore(subscribe, snapshot, serverSnapshot) || isMobile;
}
