import type { BackgroundEffects, ContourPattern, WallpaperStyle, StartupSideMenuTab } from "../../context/SettingsContext";
import { normalizeBackgroundEffects } from "./backgroundEffects";

export const MAX_COMPOSITIONS = 10;
export const COMPOSITIONS_KEY = "at_compositions_v1";
export const COMPOSITIONS_BOOT_KEY = "at_compositions_bootstrap_v1";
export type CompositionRotation = "manual" | "open" | "daily" | "weekly";

export interface CompositionAppearance {
    theme: string;
    accent: string;
    grad: string;
    customAccentHex: string;
    customGradHex: string;
    decor: string;
    blur: number;
    layout: string;
    showMobileMenuOnStart: boolean;
    startupSideMenuTab: StartupSideMenuTab;
    bg: string;
    bgUrl: string;
    bgEffects: BackgroundEffects;
    wallpaperStyle: WallpaperStyle;
    contourPattern: ContourPattern;
    contourSize: number;
    artPattern: ContourPattern;
    artSize: number;
}
export interface Composition {
    id: string;
    name: string;
    appearance: CompositionAppearance;
}
export interface CompositionStore {
    version: 1;
    items: Composition[];
    activeId: string | null;
    mode: CompositionRotation;
    weekdays: (string | null)[];
    lastCycleKey: string | null;
}
export const EMPTY_COMPOSITIONS: CompositionStore = {
    version: 1, items: [], activeId: null, mode: "manual",
    weekdays: [null, null, null, null, null, null, null], lastCycleKey: null
};
const DEFAULT_STYLE: WallpaperStyle = {
    logoEnabled: false, fillMode: "solid", fillColor: "#151515", fillGrad: "#303030",
    logoMode: "gradient", logoColor: "#f5f2ff", logoGrad: "#916cf2", logoGlow: 32
};
const keys: Record<Exclude<keyof CompositionAppearance, "customAccentHex" | "customGradHex">, string> = {
    theme: "settings_theme",
    accent: "settings_accent",
    grad: "settings_grad",
    decor: "settings_decor",
    blur: "settings_blur",
    layout: "settings_layout",
    showMobileMenuOnStart: "settings_mobile_start_menu",
    startupSideMenuTab: "settings_mobile_start_tab",
    bg: "settings_bg",
    bgUrl: "settings_bg_url",
    bgEffects: "settings_bg_effects",
    wallpaperStyle: "settings_wallpaper_style",
    contourPattern: "settings_contour_pattern",
    contourSize: "settings_contour_size",
    artPattern: "settings_art_pattern",
    artSize: "settings_art_size"
};
export const COMPOSITION_STORAGE_KEYS = keys;

export function normalizeCompositionStore(raw: unknown): CompositionStore {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_COMPOSITIONS;
    const input = raw as Partial<CompositionStore>;
    const items = Array.isArray(input.items) ? input.items
        .filter((item): item is Composition => Boolean(item && typeof item.id === "string" &&
            typeof item.name === "string" && item.appearance &&
            typeof item.appearance === "object" && typeof item.appearance.bg === "string"))
        .slice(0, MAX_COMPOSITIONS) : [];
    const ids = new Set(items.map(item => item.id));
    return {
        version: 1,
        items,
        activeId: typeof input.activeId === "string" && ids.has(input.activeId) ? input.activeId : null,
        mode: (["manual", "open", "daily", "weekly"] as const).includes(input.mode as CompositionRotation)
            ? input.mode as CompositionRotation : "manual",
        weekdays: Array.from({ length: 7 }, (_, index) => {
            const candidate = input.weekdays?.[index];
            return typeof candidate === "string" && ids.has(candidate) ? candidate : null;
        }),
        lastCycleKey: typeof input.lastCycleKey === "string" ? input.lastCycleKey : null
    };
}

export const compositionDayKey = (date: Date): string =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")].join("-");
export const compositionWeekday = (date: Date): number => (date.getDay() + 6) % 7;
export function compositionCycleKey(mode: CompositionRotation, date: Date): string | null {
    return mode === "daily" || mode === "weekly" ? mode + ":" + compositionDayKey(date) : null;
}

export function chooseComposition(store: CompositionStore, date = new Date(),
    random: () => number = Math.random, onOpen = false):
    { store: CompositionStore; composition: Composition } | null {
    if (!store.items.length || store.mode === "manual") return null;
    if (store.mode === "open" && !onOpen) return null;
    const cycle = compositionCycleKey(store.mode, date);
    if (cycle && store.lastCycleKey === cycle) return null;
    let chosen: Composition | undefined;
    if (store.mode === "weekly") {
        chosen = store.items.find(item => item.id === store.weekdays[compositionWeekday(date)]);
    } else {
        const options = store.items.length > 1
            ? store.items.filter(item => item.id !== store.activeId) : store.items;
        chosen = options[Math.min(options.length - 1, Math.max(0, Math.floor(random() * options.length)))];
    }
    if (!chosen) return null;
    return {
        composition: chosen,
        store: { ...store, activeId: chosen.id, lastCycleKey: cycle }
    };
}

export function normalizeCompositionAppearance(raw: CompositionAppearance): CompositionAppearance {
    const safeStyle = raw.wallpaperStyle && typeof raw.wallpaperStyle === "object" ? raw.wallpaperStyle : DEFAULT_STYLE;
    return {
        ...raw,
        blur: Number.isFinite(raw.blur) ? Math.max(2, Math.min(36, raw.blur)) : 6,
        contourSize: Number.isFinite(raw.contourSize) ? raw.contourSize : 1,
        artSize: Number.isFinite(raw.artSize) ? raw.artSize : 1,
        bgEffects: normalizeBackgroundEffects(raw.bgEffects),
        wallpaperStyle: { ...DEFAULT_STYLE, ...safeStyle }
    };
}

/** Save browser preferences at once, before React paints the first frame. */
export function writeCompositionAppearance(appearance: CompositionAppearance, nick: string): void {
    const selected = normalizeCompositionAppearance(appearance);
    const appearanceCache = (() => {
        try { return JSON.parse(localStorage.getItem("settings_appearance") || "{}"); }
        catch { return {}; }
    })() as Record<string, unknown>;
    const startupCache = (() => {
        try { return JSON.parse(localStorage.getItem("at_startup_preferences") || "{}"); }
        catch { return {}; }
    })() as Record<string, unknown>;
    for (const [field, key] of Object.entries(keys) as [keyof typeof keys, string][]) {
        const value = selected[field];
        localStorage.setItem(key === "settings_theme" ? key : nick + "_" + key, JSON.stringify(value));
        if (key !== "settings_theme") localStorage.setItem(key, JSON.stringify(value));
        if (key === "settings_mobile_start_menu" || key === "settings_mobile_start_tab") startupCache[key] = value;
        else if (key !== "settings_theme") appearanceCache[key] = value;
    }
    localStorage.setItem("settings_appearance", JSON.stringify(appearanceCache));
    localStorage.setItem("at_startup_preferences", JSON.stringify(startupCache));
    if (/^#[0-9a-fA-F]{6}$/.test(selected.customAccentHex))
        localStorage.setItem("customAccentHex", selected.customAccentHex);
    if (/^#[0-9a-fA-F]{6}$/.test(selected.customGradHex))
        localStorage.setItem("customGradHex", selected.customGradHex);
}

export function writeCompositionBootstrap(nick: string, state: CompositionStore): void {
    localStorage.setItem(COMPOSITIONS_BOOT_KEY, JSON.stringify({ nick, state }));
    localStorage.setItem("at_startup_last_user", nick);
}
let appliedOnOpeningFor: string | null = null;
export const compositionOpenedFor = () => appliedOnOpeningFor;

/** Runs from theme-init.ts before App imports, so the first paint uses the chosen composition. */
export function initializeOpeningComposition(): void {
    try {
        const bootstrap = JSON.parse(localStorage.getItem(COMPOSITIONS_BOOT_KEY) || "null");
        if (!bootstrap || typeof bootstrap.nick !== "string" || !bootstrap.nick) return;
        const nick = bootstrap.nick as string;
        const stored = localStorage.getItem(nick + "_" + COMPOSITIONS_KEY);
        const state = normalizeCompositionStore(stored ? JSON.parse(stored) : bootstrap.state);
        const next = chooseComposition(state, new Date(), Math.random, true);
        appliedOnOpeningFor = nick;
        if (!next) return;
        writeCompositionAppearance(next.composition.appearance, nick);
        localStorage.setItem(nick + "_" + COMPOSITIONS_KEY, JSON.stringify(next.store));
        writeCompositionBootstrap(nick, next.store);
    } catch (error) {
        console.warn("Could not apply opening composition:", error);
    }
}
