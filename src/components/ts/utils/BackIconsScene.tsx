import { backPattern } from "./backPattern";
import "../../../scss/backIconsScene.scss";

const contours = (() => {
    let seed = 61227;
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    return Array.from({ length: 54 }, (_, index) => {
        const column = index % 9;
        const row = Math.floor(index / 9);
        return {
            x: (column + .4 + random() * .4) / 9 * 100,
            y: (row + .4 + random() * .4) / 6 * 100,
            size: 6 + random() * 4,
            rotate: random() * 70 - 35,
            opacity: .12 + random() * .13,
            index: Math.floor(random() * backPattern.length)
        };
    });
})();

export default function BackIconsScene() {
    return <div className="atContourScene" aria-hidden="true">
        {contours.map((item, index) => {
            const Icon = backPattern[item.index];
            return <span key={index} className="atContourIcon" style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.size}cqw`,
                opacity: item.opacity,
                transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`
            }}>
                <Icon weight="thin"/>
            </span>;
        })}
    </div>;
}
