import { useCallback, useEffect, useState } from "react";
import { useUser } from "../UserHook";

type SetValue<T> = React.Dispatch<React.SetStateAction<T>>;

const GLOBAL_KEYS = [
    "settings_theme",
    "settings_lang",
];
const APPEARANCE_KEYS = [
    "settings_accent", "settings_grad", "settings_blur",
    "settings_layout", "settings_bg", "settings_decor",
];

export default function useLocalStorage<T>(
    key: string,
    defaultValue: T
): readonly [T, SetValue<T>] {
    const { user, initialLoading } = useUser();

    const storageKey =
        GLOBAL_KEYS.includes(key)
            ? key
            : user?.nick
                ? `${user.nick}_${key}`
                : key;

    const stateKey = initialLoading ? `loading_${storageKey}` : storageKey;
    const readValue = useCallback((): T => {
        try {
            if (initialLoading && APPEARANCE_KEYS.includes(key)) {
                const appearance = JSON.parse(localStorage.getItem("settings_appearance") ?? "{}");
                if (typeof appearance?.[key] === typeof defaultValue) return appearance[key];
            }
            const stored = localStorage.getItem(storageKey);
            return stored === null ? defaultValue : JSON.parse(stored);
        } catch {
            return defaultValue;
        }
    }, [key, storageKey, initialLoading, defaultValue]);

    const [stored, setStored] = useState(() => ({ key: stateKey, value: readValue() }));
    const value = stored.key === stateKey ? stored.value : readValue();

    useEffect(() => {
        if (stored.key !== stateKey) {
            setStored({ key: stateKey, value: readValue() });
        }
    }, [stateKey, stored.key, readValue]);

    const setValue: SetValue<T> = useCallback(next => {
        setStored(previous => {
            const current = previous.key === stateKey ? previous.value : readValue();
            return {
                key: stateKey,
                value: typeof next === "function"
                    ? (next as (value: T) => T)(current)
                    : next,
            };
        });
    }, [stateKey, readValue]);

    useEffect(() => {
        if (initialLoading || stored.key !== stateKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(stored.value));
            if (user.id && APPEARANCE_KEYS.includes(key)) {
                const appearance = JSON.parse(localStorage.getItem("settings_appearance") ?? "{}");
                localStorage.setItem("settings_appearance", JSON.stringify({
                    ...appearance,
                    [key]: stored.value,
                }));
            }
        } catch (e) {
            console.error(
                "Ошибка записи в localStorage:",
                e
            );
        }
    }, [initialLoading, key, stateKey, storageKey, stored, user.id]);

    return [value, setValue] as const;
}
