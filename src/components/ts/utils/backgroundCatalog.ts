export const MAX_CUSTOM_BACKGROUNDS = 10;

export const allBackgroundGroups = [
    { id: "essential", items: [
        { id: "landing", labelKey: "personalization.landingBackground" },
        { id: "default", labelKey: "personalization.contourShapes" },
        { id: "art", labelKey: "backgroundLibrary.art" },
        { id: "color", labelKey: "personalization.solidColor" },
        { id: "accentGlow", labelKey: "backgroundLibrary.accentGlow" }
    ] },
    { id: "atmospheric", items: [
        { id: "aurora", labelKey: "backgroundLibrary.aurora" },
        { id: "nebula", labelKey: "backgroundLibrary.nebula" },
        { id: "sunset", labelKey: "backgroundLibrary.sunset" },
        { id: "waves", labelKey: "backgroundLibrary.waves" },
        { id: "petals", labelKey: "backgroundLibrary.petals" }
    ] },
    { id: "retro", items: [
        { id: "retroDrive", labelKey: "backgroundLibrary.retroDrive" },
        { id: "neonCity", labelKey: "backgroundLibrary.neonCity" },
        { id: "laser", labelKey: "backgroundLibrary.laser" },
        { id: "orbit", labelKey: "backgroundLibrary.orbit" },
        { id: "glitch", labelKey: "backgroundLibrary.glitch" }
    ] },
    { id: "abstract", items: [
        { id: "paintSplash", labelKey: "backgroundLibrary.paintSplash" },
        { id: "liquid", labelKey: "backgroundLibrary.liquid" },
        { id: "prism", labelKey: "backgroundLibrary.prism" },
        { id: "abstractSilk", labelKey: "backgroundLibrary.abstractSilk" },
        { id: "abstractGlass", labelKey: "backgroundLibrary.abstractGlass" }
    ] },
    { id: "japanese", items: [
        { id: "japaneseNinja", labelKey: "backgroundLibrary.japaneseNinja" },
        { id: "japaneseSakura", labelKey: "backgroundLibrary.japaneseSakura" },
        { id: "japaneseAlley", labelKey: "backgroundLibrary.japaneseAlley" },
        { id: "japaneseTorii", labelKey: "backgroundLibrary.japaneseTorii" },
        { id: "japaneseGarden", labelKey: "backgroundLibrary.japaneseGarden" }
    ] },
    { id: "greek", items: [
        { id: "greekStatue", labelKey: "backgroundLibrary.greekStatue" },
        { id: "greekTemple", labelKey: "backgroundLibrary.greekTemple" },
        { id: "greekGladiator", labelKey: "backgroundLibrary.greekGladiator" },
        { id: "greekColumns", labelKey: "backgroundLibrary.greekColumns" },
        { id: "greekRuins", labelKey: "backgroundLibrary.greekRuins" }
    ] },
    { id: "myth", items: [
        { id: "mythOlympus", labelKey: "backgroundLibrary.mythOlympus" },
        { id: "mythDragon", labelKey: "backgroundLibrary.mythDragon" },
        { id: "mythTree", labelKey: "backgroundLibrary.mythTree" },
        { id: "mythUnderworld", labelKey: "backgroundLibrary.mythUnderworld" },
        { id: "mythPegasus", labelKey: "backgroundLibrary.mythPegasus" }
    ] },
    { id: "modern", items: [
        { id: "modernParis", labelKey: "backgroundLibrary.modernParis" },
        { id: "modernDubai", labelKey: "backgroundLibrary.modernDubai" },
        { id: "modernSingapore", labelKey: "backgroundLibrary.modernSingapore" },
        { id: "modernTokyo", labelKey: "backgroundLibrary.modernTokyo" },
        { id: "modernNewYork", labelKey: "backgroundLibrary.modernNewYork" }
    ] },
    { id: "ocean", items: [
        { id: "oceanWhale", labelKey: "backgroundLibrary.oceanWhale" },
        { id: "oceanAtlantis", labelKey: "backgroundLibrary.oceanAtlantis" },
        { id: "oceanJellyfish", labelKey: "backgroundLibrary.oceanJellyfish" },
        { id: "oceanReef", labelKey: "backgroundLibrary.oceanReef" },
        { id: "oceanDeep", labelKey: "backgroundLibrary.oceanDeep" }
    ] },
    { id: "gothic", items: [
        { id: "gothicCastle", labelKey: "backgroundLibrary.gothicCastle" },
        { id: "gothicCathedral", labelKey: "backgroundLibrary.gothicCathedral" },
        { id: "gothicLibrary", labelKey: "backgroundLibrary.gothicLibrary" },
        { id: "gothicTower", labelKey: "backgroundLibrary.gothicTower" },
        { id: "gothicGarden", labelKey: "backgroundLibrary.gothicGarden" }
    ] },
    { id: "element", items: [
        { id: "elementVolcano", labelKey: "backgroundLibrary.elementVolcano" },
        { id: "elementStorm", labelKey: "backgroundLibrary.elementStorm" },
        { id: "elementSnow", labelKey: "backgroundLibrary.elementSnow" },
        { id: "elementDesert", labelKey: "backgroundLibrary.elementDesert" },
        { id: "elementWaterfall", labelKey: "backgroundLibrary.elementWaterfall" }
    ] },
    { id: "neon", items: [
        { id: "neonStreet", labelKey: "backgroundLibrary.neonStreet" },
        { id: "neonHighway", labelKey: "backgroundLibrary.neonHighway" },
        { id: "neonMetropolis", labelKey: "backgroundLibrary.neonMetropolis" },
        { id: "neonTunnel", labelKey: "backgroundLibrary.neonTunnel" },
        { id: "neonArcade", labelKey: "backgroundLibrary.neonArcade" }
    ] },
    { id: "cosmic", items: [
        { id: "cosmicSaturn", labelKey: "backgroundLibrary.cosmicSaturn" },
        { id: "cosmicGalaxy", labelKey: "backgroundLibrary.cosmicGalaxy" },
        { id: "cosmicEclipse", labelKey: "backgroundLibrary.cosmicEclipse" },
        { id: "cosmicMoon", labelKey: "backgroundLibrary.cosmicMoon" },
        { id: "cosmicCloud", labelKey: "backgroundLibrary.cosmicCloud" }
    ] }
] as const;

// Keep unfinished collections and their assets, but hide them from every wallpaper picker.
const hiddenBackgroundGroupIds = new Set(["modern", "ocean", "gothic", "element", "neon", "cosmic"]);

export const backgroundGroups = allBackgroundGroups.filter(group => !hiddenBackgroundGroupIds.has(group.id));


// Commands expose only collections currently visible in the wallpaper catalog.
const wallpaperGroupAliases: Record<string, string> = { greek: "antic", myth: "myph" };
const wallpaperItemAliases: Record<string, string> = { neonCity: "city", retroDrive: "drive", paintSplash: "paint", abstractSilk: "silk", abstractGlass: "glass" };
export const shareableWallpapers = backgroundGroups.flatMap(group => group.items
    .filter(item => item.id !== "color")
    .map(item => ({
        id: item.id as string,
        labelKey: item.labelKey,
        group: group.id as string,
        commandGroup: wallpaperGroupAliases[group.id] ?? group.id,
        commandItem: wallpaperItemAliases[item.id] ?? (item.id.startsWith(group.id) && item.id !== group.id ? item.id.slice(group.id.length) : item.id).toLowerCase()
    })));

type WallpaperGallery = readonly { url: string }[];
export type WallpaperShareChoice = { kind: "stock"; id: string } | { kind: "custom"; url: string };
export const WALLPAPER_SHARE_PATH = "interface background image";
export function wallpaperCommandInput(text: string): string | null {
    const match = /^\s*\/settings\s+(?:interface\s+)?background\s+image(?:\s+(.*))?\s*$/i.exec(text);
    return match ? (match[1] ?? "").trim().toLowerCase().replace(/\s+/g, " ") : null;
}
export function normalizeWallpaperQuery(input: string) {
    return input.replace(/^greek(?=\s|$)/, "antic").replace(/^myth(?=\s|$)/, "myph");
}
export function resolveWallpaperShare(input: string, bg: string, bgUrl: string, gallery: WallpaperGallery): WallpaperShareChoice | null {
    const query = normalizeWallpaperQuery(input);
    if (query === "current") {
        if (bg === "custom" && bgUrl) return { kind: "custom", url: bgUrl };
        return shareableWallpapers.some(item => item.id === bg) ? { kind: "stock", id: bg } : null;
    }
    if (/^(?:[1-9]|10)$/.test(query)) {
        const entry = gallery[Number(query) - 1];
        return entry?.url ? { kind: "custom", url: entry.url } : null;
    }
    const stock = shareableWallpapers.find(item => item.commandGroup + " " + item.commandItem === query);
    return stock ? { kind: "stock", id: stock.id } : null;
}
export function sharedWallpaperLink(choice: WallpaperShareChoice, origin: string) {
    const url = new URL("/wallpapers", origin);
    url.searchParams.set("shared", choice.kind === "custom" ? "custom" : choice.id);
    return url.href;
}
export function parseSharedWallpaperLink(href: string, origin: string) {
    let url: URL;
    try { url = new URL(href); } catch { return null; }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        (url.origin !== origin && url.origin !== "https://achievetogether.vercel.app") ||
        url.pathname !== "/wallpapers" || url.searchParams.size !== 1 || url.hash) return null;
    const value = url.searchParams.get("shared");
    if (value === "custom") return { kind: "custom" as const };
    const stock = shareableWallpapers.find(item => item.id === value);
    return stock ? { kind: "stock" as const, id: stock.id } : null;
}
export function sharedWallpaperAttachment<T extends { type: string; url: string }>(text: string, files: readonly T[] | null | undefined, origin: string): T | undefined {
    return parseSharedWallpaperLink(text.trim(), origin)?.kind === "custom" &&
        files?.length === 1 && /^image\/(jpeg|png|webp|gif|avif)$/i.test(files[0].type) ? files[0] : undefined;
}
