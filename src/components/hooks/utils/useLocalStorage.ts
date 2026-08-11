import { useEffect, useState } from "react";
import { useUser } from "../UserHook";

type SetValue<T> = React.Dispatch<React.SetStateAction<T>>;

const GLOBAL_KEYS = [
    "settings_theme",
    "settings_lang",
    // "settings_accent",
    // "settings_grad",
    // "settings_decor"
];

export default function useLocalStorage<T>(
    key: string,
    defaultValue: T
): readonly [T, SetValue<T>] {
    const { user } = useUser();

    const storageKey =
        GLOBAL_KEYS.includes(key)
            ? key
            : user?.nick
                ? `${user.nick}_${key}`
                : key;

    const [value, setValue] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);

            if (stored) {
                setValue(JSON.parse(stored));
            } else {
                setValue(defaultValue);
            }
        } catch {
            setValue(defaultValue);
        }
    }, [storageKey]);

    useEffect(() => {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(value)
            );
        } catch (e) {
            console.error(
                "Ошибка записи в localStorage:",
                e
            );
        }
    }, [storageKey, value]);

    return [value, setValue] as const;
}