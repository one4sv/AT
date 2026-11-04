import SectionArt from "../SectionArt";
import "../../../scss/backgroundScenes.scss";

export const stockScenes = ["art", "aurora", "nebula", "sunset", "retroDrive", "neonCity", "paintSplash", "liquid", "prism", "laser", "waves", "orbit", "glitch", "petals"] as const;
export type StockScene = typeof stockScenes[number];
export const isStockScene = (id: string): id is StockScene =>
    (stockScenes as readonly string[]).includes(id);
const animated: readonly string[] = ["aurora", "nebula", "retroDrive", "neonCity", "paintSplash", "liquid", "prism", "laser", "waves", "orbit", "glitch", "petals"];
export const supportsBackgroundMotion = (bg: string) =>
    bg === "custom" || bg === "default" || bg === "landing" || animated.includes(bg);

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
    petals: createPattern(8648, 24)
};

const neonTowers = [
    { x: 0, w: 9, h: 43 }, { x: 8, w: 7, h: 62 }, { x: 14, w: 9, h: 49 },
    { x: 22, w: 10, h: 83 }, { x: 31, w: 8, h: 57 }, { x: 38, w: 11, h: 72 },
    { x: 48, w: 7, h: 46 }, { x: 54, w: 10, h: 88 }, { x: 63, w: 8, h: 53 },
    { x: 70, w: 12, h: 76 }, { x: 81, w: 8, h: 57 }, { x: 88, w: 12, h: 69 }
];

export function BackgroundScene({ variant, motion = false }: { variant: StockScene; motion?: boolean }) {
    return (
        <div className={`atScene atScene--${variant} ${motion ? "atScene--running" : ""}`} aria-hidden="true">
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
            {variant === "art" && <>
                <div className="atSceneArt atSceneArt--center"><SectionArt theme="personalization" mini/></div>
                <div className="atSceneArt atSceneArt--left"><SectionArt theme="habits" mini/></div>
                <div className="atSceneArt atSceneArt--right"><SectionArt theme="chats" mini/></div>
                <div className="atSceneArt atSceneArt--far"><SectionArt theme="notifications" mini/></div>
            </>}
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
