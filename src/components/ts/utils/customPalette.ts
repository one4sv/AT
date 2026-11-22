export type PalettePart = "accent" | "grad";
export const validHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
export function getCustomHex(part: PalettePart): string {
    const fallback = part === "accent" ? "#ff6b00" : "#a122da";
    try {
        const saved = localStorage.getItem(part === "accent" ? "customAccentHex" : "customGradHex");
        return saved && validHex(saved) ? saved : fallback;
    } catch { return fallback; }
}
export function getCustomHighlightHex(hex: string, theme: "light" | "dark"): string {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const surface = theme === "light" ? 236 : 29;
    const nearSurface = rgb.every(channel => Math.abs(channel - surface) < 60);
    const shade = nearSurface ? rgb.map(channel => Math.round(channel * .6 + (theme === "light" ? 0 : 255) * .4)) : rgb;
    return "#" + shade.map(channel => channel.toString(16).padStart(2, "0")).join("") + "66";
}
export function applyCustomPalette(accent: string, grad: string) {
    const root = document.documentElement;
    const theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    const keys = ["--accent", "--accent_text", "--accent_op", "--accent_hov", "--accent_highlight",
        "--darker_accent", "--inner_text", "--grad", "--grad_op", "--grad_hov", "--grad_highlight"];
    keys.forEach(key => root.style.removeProperty(key));
    if (accent === "custom") {
        const c = getCustomHex("accent");
        const rgb = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
        const luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
        root.style.setProperty("--accent", c);
        root.style.setProperty("--accent_text", c);
        root.style.setProperty("--accent_op", c + "2a");
        root.style.setProperty("--accent_hov", c + "3a");
        root.style.setProperty("--accent_highlight", getCustomHighlightHex(c, theme));
        root.style.setProperty("--darker_accent", `color-mix(in srgb, ${c} 75%, black)`);
        root.style.setProperty("--inner_text", luminance > 168 ? "#111111" : "#ffffff");
    }
    if (grad === "custom") {
        const c = getCustomHex("grad");
        root.style.setProperty("--grad", c);
        root.style.setProperty("--grad_op", c + "69");
        root.style.setProperty("--grad_hov", c + "81");
        root.style.setProperty("--grad_highlight", getCustomHighlightHex(c, theme));
    }
}
