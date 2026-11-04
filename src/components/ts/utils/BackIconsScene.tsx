import { backPattern } from "./backPattern";
import "../../../scss/backIconsScene.scss";
import type { ContourPattern } from "../../context/SettingsContext";

const createContours = (mode: ContourPattern) => {
    let seed = mode === "order" ? 61227 : 40419;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    return Array.from({ length: mode === "order" ? 54 : 54 }, (_, index) => {
        const column = index % 9;
        const row = Math.floor(index / 9);
        return {
            x: mode === "order" ? (column + .4 + random() * .4) / 9 * 100 : (column + .43 + random() * .14) / 9 * 100,
            y: mode === "order" ? (row + .4 + random() * .4) / 6 * 100 : (row + .43 + random() * .14) / 6 * 100,
            size: mode === "order" ? 6 + random() * 4 : 9.5 + random() * 3,
            rotate: mode === "order" ? random() * 70 - 35 : random() * 360,
            opacity: mode === "chaos" ? .07 + random() * .075 : .12 + random() * .13,
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
