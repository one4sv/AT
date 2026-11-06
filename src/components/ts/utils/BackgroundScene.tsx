import SectionArt from "../SectionArt";
import type { ArtTheme } from "../SectionArt";
import type { CSSProperties } from "react";
import type { ContourPattern } from "../../context/SettingsContext";
import "../../../scss/backgroundScenes.scss";

export const stockScenes = ["art", "aurora", "nebula", "sunset", "retroDrive", "neonCity", "paintSplash", "liquid", "prism", "laser", "waves", "orbit", "glitch", "petals", "japaneseNinja", "japaneseSakura", "japaneseAlley", "japaneseTorii", "greekStatue", "greekTemple", "greekGladiator", "greekColumns", "greekRuins", "mythOlympus", "mythDragon", "mythTree", "mythUnderworld", "mythPegasus", "modernParis", "modernDubai", "modernSingapore", "modernTokyo", "modernNewYork", "oceanWhale", "oceanAtlantis", "oceanJellyfish", "oceanReef", "oceanDeep", "gothicCastle", "gothicCathedral", "gothicLibrary", "gothicTower", "gothicGarden", "elementVolcano", "elementStorm", "elementSnow", "elementDesert", "elementWaterfall", "neonStreet", "neonHighway", "neonMetropolis", "neonTunnel", "neonArcade", "cosmicSaturn", "cosmicGalaxy", "cosmicEclipse", "cosmicMoon", "cosmicCloud", "japaneseGarden", "abstractSilk", "abstractGlass"] as const;
export type StockScene = typeof stockScenes[number];
export const photographicScenes = ["japaneseNinja", "japaneseSakura", "japaneseAlley", "japaneseTorii", "japaneseGarden", "greekStatue", "greekTemple", "greekGladiator", "greekColumns", "greekRuins", "mythOlympus", "mythDragon", "mythTree", "mythUnderworld", "mythPegasus"] as const;
export const isPhotographicScene = (id: string) =>
    (photographicScenes as readonly string[]).includes(id);

const photoSources: Partial<Record<StockScene, { desktop: string; mobile: string }>> = {
    japaneseNinja: { desktop: "/wallpapers/japanese-ninja-desktop.webp", mobile: "/wallpapers/japanese-ninja-mobile.webp" },
    japaneseSakura: { desktop: "/wallpapers/japanese-sakura-desktop.webp?v=20261106-full", mobile: "/wallpapers/japanese-sakura-mobile.webp?v=20261106-full" },
    japaneseAlley: { desktop: "/wallpapers/japanese-alley-desktop.webp?v=20261106-full", mobile: "/wallpapers/japanese-alley-mobile.webp?v=20261106-full" },
    japaneseTorii: { desktop: "/wallpapers/japanese-torii-desktop.webp?v=20261106-full", mobile: "/wallpapers/japanese-torii-mobile.webp?v=20261106-full" },
    greekStatue: { desktop: "/wallpapers/greekStatue-desktop.webp", mobile: "/wallpapers/greekStatue-mobile.webp?v=20261106-reframe" },
    greekTemple: { desktop: "/wallpapers/greekTemple-desktop.webp?v=20261106-reframe", mobile: "/wallpapers/greekTemple-mobile.webp?v=20261106-reframe" },
    greekGladiator: { desktop: "/wallpapers/greekGladiator-desktop.webp", mobile: "/wallpapers/greekGladiator-mobile.webp?v=20261106-reframe" },
    greekColumns: { desktop: "/wallpapers/greekColumns-desktop.webp?v=20261106-reframe", mobile: "/wallpapers/greekColumns-mobile.webp?v=20261106-reframe" },
    greekRuins: { desktop: "/wallpapers/greekRuins-desktop.webp", mobile: "/wallpapers/greekRuins-mobile.webp?v=20261106-reframe" },
    mythOlympus: { desktop: "/wallpapers/mythOlympus-desktop.webp", mobile: "/wallpapers/mythOlympus-mobile.webp?v=20261106-reframe" },
    mythDragon: { desktop: "/wallpapers/mythDragon-desktop.webp", mobile: "/wallpapers/mythDragon-mobile.webp?v=20261106-reframe" },
    mythTree: { desktop: "/wallpapers/mythTree-desktop.webp", mobile: "/wallpapers/mythTree-mobile.webp?v=20261106-reframe" },
    mythUnderworld: { desktop: "/wallpapers/mythUnderworld-desktop.webp", mobile: "/wallpapers/mythUnderworld-mobile.webp?v=20261106-reframe" },
    mythPegasus: { desktop: "/wallpapers/mythPegasus-desktop.webp", mobile: "/wallpapers/mythPegasus-mobile.webp?v=20261106-reframe" },
    modernParis: { desktop: "/wallpapers/modernParis-desktop.svg", mobile: "/wallpapers/modernParis-mobile.svg" },
    modernDubai: { desktop: "/wallpapers/modernDubai-desktop.svg", mobile: "/wallpapers/modernDubai-mobile.svg" },
    modernSingapore: { desktop: "/wallpapers/modernSingapore-desktop.svg", mobile: "/wallpapers/modernSingapore-mobile.svg" },
    modernTokyo: { desktop: "/wallpapers/modernTokyo-desktop.svg", mobile: "/wallpapers/modernTokyo-mobile.svg" },
    modernNewYork: { desktop: "/wallpapers/modernNewYork-desktop.svg", mobile: "/wallpapers/modernNewYork-mobile.svg" },
    oceanWhale: { desktop: "/wallpapers/oceanWhale-desktop.svg", mobile: "/wallpapers/oceanWhale-mobile.svg" },
    oceanAtlantis: { desktop: "/wallpapers/oceanAtlantis-desktop.svg", mobile: "/wallpapers/oceanAtlantis-mobile.svg" },
    oceanJellyfish: { desktop: "/wallpapers/oceanJellyfish-desktop.svg", mobile: "/wallpapers/oceanJellyfish-mobile.svg" },
    oceanReef: { desktop: "/wallpapers/oceanReef-desktop.svg", mobile: "/wallpapers/oceanReef-mobile.svg" },
    oceanDeep: { desktop: "/wallpapers/oceanDeep-desktop.svg", mobile: "/wallpapers/oceanDeep-mobile.svg" },
    gothicCastle: { desktop: "/wallpapers/gothicCastle-desktop.svg", mobile: "/wallpapers/gothicCastle-mobile.svg" },
    gothicCathedral: { desktop: "/wallpapers/gothicCathedral-desktop.svg", mobile: "/wallpapers/gothicCathedral-mobile.svg" },
    gothicLibrary: { desktop: "/wallpapers/gothicLibrary-desktop.svg", mobile: "/wallpapers/gothicLibrary-mobile.svg" },
    gothicTower: { desktop: "/wallpapers/gothicTower-desktop.svg", mobile: "/wallpapers/gothicTower-mobile.svg" },
    gothicGarden: { desktop: "/wallpapers/gothicGarden-desktop.svg", mobile: "/wallpapers/gothicGarden-mobile.svg" },
    elementVolcano: { desktop: "/wallpapers/elementVolcano-desktop.svg", mobile: "/wallpapers/elementVolcano-mobile.svg" },
    elementStorm: { desktop: "/wallpapers/elementStorm-desktop.svg", mobile: "/wallpapers/elementStorm-mobile.svg" },
    elementSnow: { desktop: "/wallpapers/elementSnow-desktop.svg", mobile: "/wallpapers/elementSnow-mobile.svg" },
    elementDesert: { desktop: "/wallpapers/elementDesert-desktop.svg", mobile: "/wallpapers/elementDesert-mobile.svg" },
    elementWaterfall: { desktop: "/wallpapers/elementWaterfall-desktop.svg", mobile: "/wallpapers/elementWaterfall-mobile.svg" },
    neonStreet: { desktop: "/wallpapers/neonStreet-desktop.svg", mobile: "/wallpapers/neonStreet-mobile.svg" },
    neonHighway: { desktop: "/wallpapers/neonHighway-desktop.svg", mobile: "/wallpapers/neonHighway-mobile.svg" },
    neonMetropolis: { desktop: "/wallpapers/neonMetropolis-desktop.svg", mobile: "/wallpapers/neonMetropolis-mobile.svg" },
    neonTunnel: { desktop: "/wallpapers/neonTunnel-desktop.svg", mobile: "/wallpapers/neonTunnel-mobile.svg" },
    neonArcade: { desktop: "/wallpapers/neonArcade-desktop.svg", mobile: "/wallpapers/neonArcade-mobile.svg" },
    cosmicSaturn: { desktop: "/wallpapers/cosmicSaturn-desktop.svg", mobile: "/wallpapers/cosmicSaturn-mobile.svg" },
    cosmicGalaxy: { desktop: "/wallpapers/cosmicGalaxy-desktop.svg", mobile: "/wallpapers/cosmicGalaxy-mobile.svg" },
    cosmicEclipse: { desktop: "/wallpapers/cosmicEclipse-desktop.svg", mobile: "/wallpapers/cosmicEclipse-mobile.svg" },
    cosmicMoon: { desktop: "/wallpapers/cosmicMoon-desktop.svg", mobile: "/wallpapers/cosmicMoon-mobile.svg" },
    cosmicCloud: { desktop: "/wallpapers/cosmicCloud-desktop.svg", mobile: "/wallpapers/cosmicCloud-mobile.svg" },
    japaneseGarden: { desktop: "/wallpapers/japaneseGarden-desktop.webp?v=20261106-reframe", mobile: "/wallpapers/japaneseGarden-mobile.webp?v=20261106-reframe" },
    abstractSilk: { desktop: "/wallpapers/abstractSilk-desktop.svg", mobile: "/wallpapers/abstractSilk-mobile.svg" },
    abstractGlass: { desktop: "/wallpapers/abstractGlass-desktop.svg", mobile: "/wallpapers/abstractGlass-mobile.svg" }
};

export const isThemeAwareVectorScene = (id: string) =>
    photoSources[id as StockScene]?.desktop.endsWith(".svg") ?? false;

export const isStockScene = (id: string): id is StockScene =>
    (stockScenes as readonly string[]).includes(id);
const animated: readonly string[] = ["art", "aurora", "nebula", "retroDrive", "neonCity", "paintSplash", "liquid", "prism", "laser", "waves", "orbit", "glitch", "petals"];
export const supportsBackgroundMotion = (bg: string) =>
    animated.includes(bg);

type Particle = {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    opacity: number;
};

function createPattern(seed: number, count: number): Particle[] {
    let state = seed;
    const random = () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };

    return Array.from({ length: count }, () => ({
        x: Math.round(random() * 100),
        y: Math.round(random() * 100),
        width: Math.round(12 + random() * 27),
        height: Math.round(13 + random() * 34),
        angle: Math.round(random() * 160 - 80),
        opacity: Math.round((.16 + random() * .28) * 100) / 100
    }));
}

// Fixed pseudo-random seeds give each built-in theme its own organic pattern.
// The same pattern is rendered in the thumbnail and on the page; all its colors
// come from the user's current --accent and --grad CSS variables.
const patterns: Record<StockScene, Particle[]> = {
    art: createPattern(721, 14),
    aurora: createPattern(1337, 16),
    nebula: createPattern(4099, 22),
    sunset: createPattern(911, 12),
    retroDrive: createPattern(701, 15),
    neonCity: createPattern(1584, 15),
    paintSplash: createPattern(2467, 28),
    liquid: createPattern(3350, 15),
    prism: createPattern(4233, 15),
    laser: createPattern(5116, 15),
    waves: createPattern(5999, 15),
    orbit: createPattern(6882, 15),
    glitch: createPattern(7765, 15),
    petals: createPattern(8648, 24),
    japaneseNinja: [],
    japaneseSakura: [],
    japaneseAlley: [],
    japaneseTorii: [],
    greekStatue: [],
    greekTemple: [],
    greekGladiator: [],
    greekColumns: [],
    greekRuins: [],
    mythOlympus: [],
    mythDragon: [],
    mythTree: [],
    mythUnderworld: [],
    mythPegasus: [],
    modernParis: [],
    modernDubai: [],
    modernSingapore: [],
    modernTokyo: [],
    modernNewYork: [],
    oceanWhale: [],
    oceanAtlantis: [],
    oceanJellyfish: [],
    oceanReef: [],
    oceanDeep: [],
    gothicCastle: [],
    gothicCathedral: [],
    gothicLibrary: [],
    gothicTower: [],
    gothicGarden: [],
    elementVolcano: [],
    elementStorm: [],
    elementSnow: [],
    elementDesert: [],
    elementWaterfall: [],
    neonStreet: [],
    neonHighway: [],
    neonMetropolis: [],
    neonTunnel: [],
    neonArcade: [],
    cosmicSaturn: [],
    cosmicGalaxy: [],
    cosmicEclipse: [],
    cosmicMoon: [],
    cosmicCloud: [],
    japaneseGarden: [],
    abstractSilk: [],
    abstractGlass: []
};

// All available SectionArt motifs can appear in the chaotic wallpaper.
// A per-load seed gives a fresh composition, shared by the page and thumbnails.
const artThemes: ArtTheme[] = [
    "general", "account", "personalization", "habits", "chats",
    "notifications", "security", "privacy", "about", "contacts",
    "faq", "policy", "terms", "growth", "future", "community", "roadmap"
];

function createArtChaos() {
    let seed = Math.floor(Math.random() * 4294967296);
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    const themes = [...artThemes];
    for (let i = themes.length - 1; i > 0; i--) {
        const index = Math.floor(random() * (i + 1));
        [themes[i], themes[index]] = [themes[index], themes[i]];
    }

    const positions: { x: number; y: number }[] = [];
    return themes.slice(0, 8).map(theme => {
        let x = 0;
        let y = 0;
        for (let attempt = 0; attempt < 35; attempt++) {
            x = 2 + random() * 70;
            y = 2 + random() * 82;
            if (positions.every(item => Math.hypot((item.x - x) * 1.2, item.y - y) > 19)) break;
        }
        positions.push({ x, y });

        return {
            theme,
            x,
            y,
            width: 23 + random() * 11,
            rotation: random() * 38 - 19,
            delay: -random() * 9
        };
    });
}

const chaoticArtwork = createArtChaos();

const neonTowers = [
    { x: 0, w: 9, h: 43 }, { x: 8, w: 7, h: 62 }, { x: 14, w: 9, h: 49 },
    { x: 22, w: 10, h: 83 }, { x: 31, w: 8, h: 57 }, { x: 38, w: 11, h: 72 },
    { x: 48, w: 7, h: 46 }, { x: 54, w: 10, h: 88 }, { x: 63, w: 8, h: 53 },
    { x: 70, w: 12, h: 76 }, { x: 81, w: 8, h: 57 }, { x: 88, w: 12, h: 69 }
];

export function BackgroundScene({ variant, motion = false, artPattern = "order", artSize = 1 }: { variant: StockScene; motion?: boolean; artPattern?: ContourPattern; artSize?: number }) {
    const photo = photoSources[variant];
    return (
        <div className={`atScene atScene--${variant} ${motion ? "atScene--running" : ""} ${variant === "art" ? `atScene--art-${artPattern}` : ""}`}
            style={{ "--art-size": artSize } as CSSProperties} aria-hidden="true">
            <div className="atScenePattern">
                {patterns[variant].map((particle, index) => (
                    <span key={index}
                        className={`atSceneParticle ${index % 3 === 0 ? "atSceneParticle--grad" : ""}`}
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.width}%`,
                            height: `${particle.height}%`,
                            opacity: particle.opacity,
                            transform: `translate(-50%, -50%) rotate(${particle.angle}deg)`
                        }}
                    />
                ))}
            </div>
            {photo && <picture className={`atScenePhoto ${isThemeAwareVectorScene(variant) ? "atScenePhoto--themeAware" : ""}`}>
                <source media="(max-width: 800px)" srcSet={photo.mobile} type={photo.mobile.endsWith(".svg") ? "image/svg+xml" : "image/webp"}/>
                <img src={photo.desktop} alt="" decoding="sync" loading="eager"/>
            </picture>}
            {variant === "art" && (artPattern === "chaos" ?
                chaoticArtwork.map((item, index) => (
                    <div key={item.theme} className="atSceneArt atSceneArt--scattered"
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            width: `${item.width}%`,
                            rotate: `${item.rotation}deg`,
                            animationDelay: `${item.delay}s`,
                            zIndex: index + 1
                        }}>
                        <SectionArt theme={item.theme} mini/>
                    </div>
                )) : <>
                    <div className="atSceneArt atSceneArt--center"><SectionArt theme="personalization" mini/></div>
                    <div className="atSceneArt atSceneArt--left"><SectionArt theme="habits" mini/></div>
                    <div className="atSceneArt atSceneArt--right"><SectionArt theme="chats" mini/></div>
                    <div className="atSceneArt atSceneArt--far"><SectionArt theme="notifications" mini/></div>
                </>)}
            {variant === "aurora" && <>
                <div className="atAurora atAurora--first"/>
                <div className="atAurora atAurora--second"/>
                <div className="atAurora atAurora--third"/>
            </>}
            {variant === "sunset" && <>
                <div className="atSun"/>
                <div className="atHorizon atHorizon--far"/>
                <div className="atHorizon atHorizon--near"/>
            </>}
            {variant === "retroDrive" && <>
                <div className="atRetroSun"/>
                <div className="atRetroMountains"/>
                <div className="atRetroRoad"/>
            </>}
            {variant === "neonCity" && <>
                <div className="atNeonMoon"/>
                <div className="atNeonSkyline">
                    {neonTowers.map((tower, index) => (
                        <div key={index} className={`atNeonTower ${index % 3 === 0 ? "atNeonTower--grad" : ""}`}
                            style={{ left: `${tower.x}%`, width: `${tower.w}%`, height: `${tower.h}%` }}/>
                    ))}
                </div>
                <div className="atNeonStreet"/>
                <div className="atNeonCityGlow"/>
            </>}
            {variant === "laser" && <div className="atLaserFloor"/>}
            {variant === "orbit" && <div className="atOrbitSun"/>}
            {variant === "waves" && <div className="atWaveHorizon"/>}
        </div>
    );
}
