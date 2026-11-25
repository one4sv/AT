import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useUser } from "../UserHook";
import { api } from "../../ts/api";

type AliasRow = { contact_id: string; alias: string };
type Store = { values: Map<string, string>; pending: Promise<void> | null; updatedAt: number; revision: number };
const stores = new Map<string, Store>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};
const storeFor = (owner: string): Store => {
    let store = stores.get(owner);
    if (!store) {
        store = { values: new Map(), pending: null, updatedAt: 0, revision: 0 };
        stores.set(owner, store);
    }
    return store;
};
const localKey = (owner: string, contact: string) => "at-contact-alias:" + owner + ":" + contact;

async function write(owner: string, contact: string, alias: string, importLocal = false) {
    const response = await api.put("contact-aliases/" + encodeURIComponent(contact), {
        owner_id: owner, alias, import_local: importLocal
    });
    if (!response.data.success || response.data.owner_id !== owner ||
        response.data.contact_id !== contact || typeof response.data.alias !== "string") throw new Error("Alias save failed");
    return response.data.alias as string;
}

function refresh(owner: string, force = false): Promise<void> {
    const store = storeFor(owner);
    if (store.pending) return store.pending;
    if (!force && Date.now() - store.updatedAt < 30000) return Promise.resolve();
    const revision = store.revision;
    store.pending = (async () => {
        const response = await api.get("contact-aliases");
        if (!response.data.success || response.data.owner_id !== owner || !Array.isArray(response.data.aliases)) return;
        const values = new Map<string, string>((response.data.aliases as AliasRow[]).map(row => [row.contact_id, row.alias]));
        if (revision !== store.revision) return;
        store.values = values;
        store.updatedAt = Date.now();
        notify();

        // Import old device-only names without overwriting a cloud value or a reset.
        const prefix = localKey(owner, "");
        let keys: string[] = [];
        try { keys = Object.keys(localStorage).filter(key => key.startsWith(prefix)); }
        catch { return; }
        for (const key of keys) {
            if (revision !== store.revision) break;
            const contact = key.slice(prefix.length);
            try {
                const legacy = localStorage.getItem(key);
                if (!legacy || !contact) continue;
                if (!values.has(contact)) {
                    const saved = await write(owner, contact, legacy.trim().slice(0, 40), true);
                    if (revision !== store.revision) break;
                    values.set(contact, saved);
                    notify();
                }
                localStorage.removeItem(key);
            } catch { /* Keep the old value for the next successful refresh. */ }
        }
    })().catch(() => {}).finally(() => { store.pending = null; });
    return store.pending;
}

export default function useContactAlias(contactId?: string | null) {
    const { user, initialLoading } = useUser();
    const owner = !initialLoading ? user.id : null;
    const contact = contactId && owner !== contactId ? contactId : null;
    const read = useCallback(() => owner && contact ? stores.get(owner)?.values.get(contact) || "" : "", [owner, contact]);
    const alias = useSyncExternalStore(subscribe, read, () => "");

    useEffect(() => {
        if (!owner || !contact) return;
        void refresh(owner);
        const onFocus = () => { if (document.visibilityState === "visible") void refresh(owner, true); };
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onFocus);
        return () => {
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onFocus);
        };
    }, [owner, contact]);

    const save = useCallback(async (value: string) => {
        if (!owner || !contact) throw new Error("Alias owner unavailable");
        const store = storeFor(owner);
        store.revision++;
        const saved = await write(owner, contact, value.trim().slice(0, 40));
        store.revision++;
        store.values.set(contact, saved);
        try { localStorage.removeItem(localKey(owner, contact)); } catch { /* Cloud is authoritative. */ }
        notify();
    }, [owner, contact]);
    return [alias, save] as const;
}
