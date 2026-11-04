import SectionArt from "../SectionArt";
import "../../../scss/backgroundScenes.scss";

export type StockScene = "art" | "aurora" | "nebula" | "sunset";

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
    sunset: createPattern(911, 12)
};

export function BackgroundScene({ variant }: { variant: StockScene }) {
    return (
        <div className={`atScene atScene--${variant}`} aria-hidden="true">
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
        </div>
    );
}
