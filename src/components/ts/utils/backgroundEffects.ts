import type { BackgroundEffects } from "../../context/SettingsContext";

export const defaultBackgroundEffects: BackgroundEffects = {
    blur: 0,
    movement: false,
    filter: "none",
    speed: 1
};

const backgroundFilters: BackgroundEffects["filter"][] = [
    "none", "grayscale", "sepia", "invert", "contrast", "saturate"
];

export function normalizeBackgroundEffects(value: unknown): BackgroundEffects {
    const effects = value && typeof value === "object" && !Array.isArray(value)
        ? value as Partial<BackgroundEffects> : {};

    return {
        blur: typeof effects.blur === "number" && Number.isFinite(effects.blur)
            ? Math.max(0, Math.min(30, effects.blur)) : defaultBackgroundEffects.blur,
        movement: typeof effects.movement === "boolean"
            ? effects.movement : defaultBackgroundEffects.movement,
        filter: backgroundFilters.includes(effects.filter as BackgroundEffects["filter"])
            ? effects.filter as BackgroundEffects["filter"] : defaultBackgroundEffects.filter,
        speed: typeof effects.speed === "number" && Number.isFinite(effects.speed)
            ? Math.max(0, Math.min(3, effects.speed)) : defaultBackgroundEffects.speed
    };
}

function isCachedEffects(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const effects = value as Partial<BackgroundEffects>;
    return typeof effects.blur === "number" && Number.isFinite(effects.blur)
        && typeof effects.movement === "boolean"
        && backgroundFilters.includes(effects.filter as BackgroundEffects["filter"])
        && (effects.speed === undefined ||
            (typeof effects.speed === "number" && Number.isFinite(effects.speed)));
}

export function hasCachedBackgroundEffects(nick: string | null, initialLoading: boolean) {
    try {
        if (initialLoading || !nick) {
            const appearance = JSON.parse(localStorage.getItem("settings_appearance") ?? "{}");
            if (isCachedEffects(appearance?.settings_bg_effects)) return true;
            return isCachedEffects(JSON.parse(localStorage.getItem("settings_bg_effects") ?? "null"));
        }
        return isCachedEffects(JSON.parse(localStorage.getItem(`${nick}_settings_bg_effects`) ?? "null"));
    } catch {
        return false;
    }
}
