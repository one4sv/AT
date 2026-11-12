import type { CSSProperties } from "react";
import type { WallpaperStyle } from "../../context/SettingsContext";
import "../scss/WallpaperMark.scss";

export default function WallpaperMark({ style }: { style: WallpaperStyle }) {
    return <div className="wallpaperMark" style={{ "--mark-glow": style.logoGlow / 100, "--mark-main": style.logoColor, "--mark-grad": style.logoMode === "gradient" ? style.logoGrad : style.logoColor } as CSSProperties}>
        <svg viewBox="0 0 1024 1024" role="img" aria-label="AT" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="wallpaperMarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={style.logoColor}/>
                    <stop offset="100%" stopColor={style.logoMode === "gradient" ? style.logoGrad : style.logoColor}/>
                </linearGradient>
            </defs>
            <g fill="url(#wallpaperMarkGradient)">
                <path d="M 448 211 L 426 257 L 323 488 L 425 454 L 429 451 L 487 321 L 489 320 L 595 557 L 593 559 L 497 558 L 495 560 L 470 634 L 627 634 L 630 638 L 634 650 L 688 769 L 785 769 L 787 767 L 788 713 L 789 390 L 862 388 L 862 313 L 634 313 L 634 388 L 708 390 L 706 606 L 703 602 L 684 557 L 614 403 L 604 377 L 568 298 L 532 212 Z"/>
                <path d="M 493 451 L 490 451 L 323 513 L 355 540 L 356 543 L 226 683 L 185 802 L 207 802 L 403 588 L 405 588 L 445 629 Z"/>
            </g>
        </svg>
    </div>;
}
