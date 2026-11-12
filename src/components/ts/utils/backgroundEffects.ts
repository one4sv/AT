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
