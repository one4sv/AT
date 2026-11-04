import { backPattern } from "./backPattern";
import "../../../scss/backIconsScene.scss";
import type { ContourPattern } from "../../context/SettingsContext";

const createContours = (mode: ContourPattern) => {
    // One random arrangement per page load: every preview uses the same composition,
    // while the next visit gives "Хаос" new positions and icons.
    let seed = mode === "order" ? 61227 : Math.floor(Math.random() * 4294967296);
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const positions: { x: number; y: number }[] = [];

    return Array.from({ length: mode === "order" ? 54 : 108 }, (_, index) => {
        const column = index % 9;
        const row = Math.floor(index / 9);
        let x = (column + .4 + random() * .4) / 9 * 100;
        let y = (row + .4 + random() * .4) / 6 * 100;

        if (mode === "chaos") {
            // Never derive the chaotic layout from grid cells.
            // Gentle spacing avoids huge piles without producing straight rows.
            for (let attempt = 0; attempt < 18; attempt++) {
                x = 1 + random() * 98;
                y = 1 + random() * 98;
                if (positions.every(item => Math.hypot((item.x - x) * 1.3, item.y - y) > 3.2)) break;
            }
        }

        positions.push({ x, y });

        return {
            x,
            y,
            size: mode === "order" ? 6 + random() * 4 : 4.5 + random() * 5,
            rotate: mode === "order" ? random() * 70 - 35 : random() * 360,
            opacity: mode === "chaos" ? .075 + random() * .12 : .12 + random() * .13,
            index: Math.floor(random() * backPattern.length)
        };
    });
};

const orderedContours = createContours("order");
const chaoticContours = createContours("chaos");

export default function BackIconsScene({ pattern = "order", size = 1 }: { pattern?: ContourPattern; size?: number }) {
    const contours = pattern === "chaos" ? chaoticContours : orderedContours;

    return <div className="atContourScene" aria-hidden="true">
        {contours.map((item, index) => {
            const Icon = backPattern[item.index];
            return <span key={index} className="atContourIcon" style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.size * size}cqw`,
                opacity: item.opacity,
                transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`
            }}>
                <Icon weight="thin"/>
            </span>;
        })}
    </div>;
}
