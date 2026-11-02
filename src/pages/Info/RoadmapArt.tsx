import { useId } from "react";

export default function RoadmapArt() {
    const gradient = useId().replace(/:/g, "");

    return (
        <div className="roadmapArt" aria-hidden="true">
            <svg viewBox="0 0 360 176" fill="none" focusable="false">
                <defs>
                    <linearGradient id={gradient} x1="45" y1="140" x2="285" y2="30" gradientUnits="userSpaceOnUse">
                        <stop stopColor="var(--accent)"/>
                        <stop offset="1" stopColor="var(--grad)"/>
                    </linearGradient>
                </defs>
                <rect x="25" y="20" width="310" height="136" rx="24" fill="var(--accent_op)" />
                <path d="M79 123L155 87L226 104L286 50" stroke="var(--borderHabit)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M79 123L155 87L226 104L286 50" stroke={`url(#${gradient})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="48" y="94" width="64" height="47" rx="16" fill="var(--mc)" stroke="var(--borderWh)" strokeWidth="2"/>
                <rect x="125" y="56" width="62" height="52" rx="16" fill="var(--mc)" stroke="var(--borderWh)" strokeWidth="2"/>
                <rect x="249" y="21" width="74" height="60" rx="19" fill={`url(#${gradient})`}/>
                <path d="M61 112H98M61 121H87M140 75H174M140 85H162" stroke="var(--borderWh)" strokeWidth="3" strokeLinecap="round"/>
                <path d="M269 54L281 63L304 38" stroke="var(--inner_text)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="226" cy="104" r="10" fill="var(--bgc)" stroke="var(--accent)" strokeWidth="4"/>
                <circle className="roadmapArtCurrent" cx="286" cy="50" r="19" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 7"/>
                <circle cx="110" cy="45" r="5" fill="var(--accent)"/>
                <circle cx="208" cy="37" r="4" fill="var(--grad)"/>
                <path d="M213 139h36m-18-18v36" stroke="var(--accent_text)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
        </div>
    );
}
