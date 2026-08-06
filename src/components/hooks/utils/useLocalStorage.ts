import { useEffect, useState } from "react";
import { useUser } from "../UserHook";

export default function useLocalStorage<T>(
    key: string,
    defaultValue: T
) {
    const { user } = useUser();

    const storageKey = `${user.nick ?? "guest"}_${key}`;

    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);

            setValue(
                stored
                    ? JSON.parse(stored)
                    : defaultValue
            );
        } catch {
            setValue(defaultValue);
        }
    }, [storageKey, defaultValue]);

    useEffect(() => {
        localStorage.setItem(
            storageKey,
            JSON.stringify(value)
        );
    }, [storageKey, value]);

    return [value, setValue] as const;
}