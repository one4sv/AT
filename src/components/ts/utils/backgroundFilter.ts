import type { BackgroundEffects } from "../../context/SettingsContext";

export function getBackgroundFilter(effects: BackgroundEffects, scale = 1) {
    const filter = ({
        none: "",
        grayscale: "grayscale(1)",
        sepia: "sepia(1)",
        invert: "invert(1)",
        contrast: "contrast(1.4)",
        saturate: "saturate(1.8)"
    } as const)[effects.filter] ?? "";

    return `blur(${effects.blur * scale}px) ${filter}`.trim();
}
