import { useCallback, useEffect, useState } from "react";
import { useUser } from "../UserHook";
type SetValue<T> = React.Dispatch<React.SetStateAction<T>>;
const GLOBAL_KEYS = ["settings_theme", "settings_lang"];
const STARTUP_KEYS = ["settings_startup_page", "settings_mobile_start_menu", "settings_mobile_start_tab"];
const STARTUP_CACHE_KEY = "at_startup_preferences";
const readStartupCache = (key: string): unknown => {
    try {
        const cached = JSON.parse(localStorage.getItem(STARTUP_CACHE_KEY) ?? "{}");
        if (cached && typeof cached === "object" && Object.prototype.hasOwnProperty.call(cached, key)) {
            return cached[key];
        }
        // One-time fallback for settings saved before the bootstrap cache existed.
        const previousNick = localStorage.getItem("at_startup_last_user");
        const stored = previousNick ? localStorage.getItem(`${previousNick}_${key}`) : null;
        if (stored !== null) return JSON.parse(stored);
        const matches = Object.keys(localStorage).filter(item => item.endsWith(`_${key}`));
        if (matches.length === 1) return JSON.parse(localStorage.getItem(matches[0]) ?? "null");
    } catch {
        return undefined;
    }
    return undefined;
};
const APPEARANCE_KEYS = ["settings_accent", "settings_grad", "settings_blur", "settings_layout", "settings_bg", "settings_bg_url", "settings_decor", "settings_bg_effects", "settings_contour_pattern", "settings_contour_size", "settings_art_pattern", "settings_art_size"];
const readAppearance = (): Record<string, unknown> => {
    try {
        const value = JSON.parse(localStorage.getItem("settings_appearance") ?? "{}");
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
};
export default function useLocalStorage<T>(key: string, defaultValue: T): readonly [T, SetValue<T>] {
    const {
        user,
        initialLoading
    } = useUser();
    const storageKey = GLOBAL_KEYS.includes(key) ? key : user?.nick ? `${user.nick}_${key}` : key;
    const stateKey = initialLoading ? `loading_${storageKey}` : storageKey;
    const readValue = useCallback(
        (): T => {
            try {
                if ((initialLoading || !user?.nick) && STARTUP_KEYS.includes(key)) {
                    const startupValue = readStartupCache(key);
                    if (typeof startupValue === typeof defaultValue) return startupValue as T;
                }
                if ((initialLoading || !user?.nick) && APPEARANCE_KEYS.includes(key)) {
                    const appearance = readAppearance();
                    if (typeof appearance[key] === typeof defaultValue) return appearance[key] as T;
                }
                const stored = localStorage.getItem(storageKey);
                return stored === null ? defaultValue : JSON.parse(stored);
            } catch {
                return defaultValue;
            }
        },
        [key, storageKey, initialLoading, defaultValue, user?.nick]
    );
    const [stored, setStored] = useState(() => ({
        key: stateKey,
        value: readValue()
    }));
    const value = stored.key === stateKey ? stored.value : readValue();

    useEffect(
        () => {
            if (stored.key !== stateKey) {
                setStored(
                    {
                        key: stateKey,
                        value: readValue()
                    }
                );
            }
        },
        [stateKey, stored.key, readValue]
    );
    const setValue: SetValue<T> = useCallback(
        next => {
            setStored(
                previous => {
                    const current = previous.key === stateKey ? previous.value : readValue();
                    return {
                        key: stateKey,
                        value: typeof next === "function" ? (next as (value: T) => T)(current) : next
                    };
                }
            );
        },
        [stateKey, readValue]
    );

    useEffect(
        () => {
            if (initialLoading || stored.key !== stateKey) return;
            try {
                localStorage.setItem(storageKey, JSON.stringify(stored.value));
                if (user.nick && STARTUP_KEYS.includes(key)) {
                    const cached = JSON.parse(localStorage.getItem(STARTUP_CACHE_KEY) ?? "{}");
                    localStorage.setItem(STARTUP_CACHE_KEY, JSON.stringify({
                        ...(cached && typeof cached === "object" ? cached : {}),
                        [key]: stored.value
                    }));
                    localStorage.setItem("at_startup_last_user", user.nick);
                }
                if (user.id && APPEARANCE_KEYS.includes(key)) {
                    const appearance = readAppearance();
                    localStorage.setItem(
                        "settings_appearance",
                        JSON.stringify(
                            {
                                ...appearance,
                                [key]: stored.value
                            }
                        )
                    );
                    localStorage.setItem(key, JSON.stringify(stored.value));
                }
            } catch (e) {
                console.error("Ошибка записи в localStorage:", e);
            }
        },
        [initialLoading, key, stateKey, storageKey, stored, user.id]
    );
    return [value, setValue] as const;
}
