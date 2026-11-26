import { MAX_COMPOSITIONS, type Composition, type CompositionAppearance } from "./compositions.ts";
import { backgroundGroups } from "./backgroundCatalog.ts";
import { normalizeBackgroundEffects } from "./backgroundEffects.ts";

export const COMPOSITION_SHARE_PATH = "interface compositions";
export function compositionCommandInput(text: string): string | null {
    const match = /^\s*\/settings\s+interface\s+compositions(?:\s+(.*))?\s*$/i.exec(text);
    return match ? (match[1] ?? "").trim() : null;
}
export function resolveCompositionShare(input: string, items: readonly Composition[]) {
    return /^(?:[1-9]|10)$/.test(input) && Number(input) <= MAX_COMPOSITIONS ? items[Number(input) - 1] ?? null : null;
}

const oneOf = <T extends string>(value: unknown, values: readonly T[], fallback: T): T =>
    values.includes(value as T) ? value as T : fallback;
const num = (value: unknown, min: number, max: number, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const hex = (value: unknown, fallback: string) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const supportedBg: string[] = [...backgroundGroups.flatMap(group => group.items.map(item => item.id)), "custom", "logo"];

// Explicit allowlist: received links cannot inject CSS, external image URLs or local storage keys.
export function compositionSnapshot(value: unknown): Composition | null {
    const data = record(value);
    const a = record(data.appearance);
    if (typeof data.name !== "string" || typeof a.bg !== "string" || !supportedBg.includes(a.bg)) return null;
    const style = record(a.wallpaperStyle);
    const appearance: CompositionAppearance = {
        theme: oneOf(a.theme, ["dark","light","system"], "dark"),
        accent: oneOf(a.accent, ["poison","space","apple","sky","orange","inversion","abyss","custom"], "poison"),
        grad: oneOf(a.grad, ["meadow","violet","rubin","ocean","ginger","mono","void","custom"], "meadow"),
        customAccentHex: hex(a.customAccentHex, "#14b314"),
        customGradHex: hex(a.customGradHex, "#14b314"),
        decor: oneOf(a.decor, ["default","glass"], "glass"),
        blur: num(a.blur,2,36,6),
        layout: oneOf(a.layout, ["always","hidden"], "always"),
        showMobileMenuOnStart: a.showMobileMenuOnStart === true,
        startupSideMenuTab: oneOf(a.startupSideMenuTab, ["chats","habits"], "chats"),
        bg: a.bg, bgUrl: "",
        bgEffects: normalizeBackgroundEffects(a.bgEffects),
        wallpaperStyle: {
            fillMode: oneOf(style.fillMode, ["solid","gradient"], "solid"),
            fillColor: hex(style.fillColor,"#151515"), fillGrad: hex(style.fillGrad,"#303030"),
            logoEnabled: style.logoEnabled === true,
            logoMode: oneOf(style.logoMode, ["solid","gradient"], "gradient"),
            logoColor: hex(style.logoColor,"#f5f2ff"), logoGrad: hex(style.logoGrad,"#916cf2"),
            logoGlow: num(style.logoGlow,0,100,32)
        },
        contourPattern: oneOf(a.contourPattern, ["order","chaos"], "order"),
        contourSize: num(a.contourSize,.1,10,1),
        artPattern: oneOf(a.artPattern, ["order","chaos"], "order"),
        artSize: num(a.artSize,.1,10,1)
    };
    return { id: "shared-composition", name: data.name.trim().slice(0,120) || "Composition", appearance };
}
export function sharedCompositionLink(item: Composition, origin: string): string | null {
    const snapshot = compositionSnapshot(item);
    if (!snapshot) return null;
    const url = new URL("/settings/pers", origin);
    url.searchParams.set("composition", JSON.stringify(snapshot));
    return url.href;
}
export function parseSharedCompositionLink(href: string, origin: string): Composition | null {
    try {
        const url = new URL(href);
        if (!["http:","https:"].includes(url.protocol) || url.username || url.password ||
            (url.origin !== origin && url.origin !== "https://achievetogether.vercel.app") ||
            url.pathname !== "/settings/pers" || url.searchParams.size !== 1 || url.hash) return null;
        const data = url.searchParams.get("composition");
        return data && data.length <= 5000 ? compositionSnapshot(JSON.parse(data)) : null;
    } catch { return null; }
}
export function sharedCompositionAttachment<T extends { type: string; url: string }>(text: string, files: readonly T[] | null | undefined, origin: string): T | undefined {
    return parseSharedCompositionLink(text.trim(), origin)?.appearance.bg === "custom" &&
        files?.length === 1 && /^image\/(jpeg|png|webp|gif|avif)$/i.test(files[0].type) ? files[0] : undefined;
}
