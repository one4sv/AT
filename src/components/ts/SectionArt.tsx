import { useEffect, useId, useRef, useState } from "react";
import "../../scss/SectionArt.scss";

export type ArtTheme = "general" | "account" | "personalization" | "habits" | "chats" | "notifications" | "security" | "privacy" | "about" | "contacts" | "faq" | "policy" | "terms" | "growth" | "future" | "community";

const themes: Record<string, ArtTheme> = {
    gen: "general", pers: "personalization", activities: "habits", notes: "notifications",
    acc: "account", account: "account", chats: "chats", security: "security", privacy: "privacy",
    about: "about", contacts: "contacts", faq: "faq", policy: "policy", terms: "terms"
};

function Motif({ theme }: { theme: ArtTheme }) {
    switch (theme) {
        case "general": return <>
            <rect x="-57" y="-43" width="114" height="86" rx="20" className="artPaper"/>
            {[-22, 0, 22].map((y, i) => <g key={y}>
                <path d={`M-35 ${y}H35`} className="artLine"/>
                <circle cx={i === 1 ? 18 : -18} cy={y} r="8" className={`artSolid artSlide artDelay${i}`}/>
            </g>)}
        </>;
        case "account": return <>
            <rect x="-56" y="-48" width="112" height="96" rx="24" className="artPaper"/>
            <circle cx="0" cy="-17" r="16" className="artTint"/>
            <path d="M-29 26c0-31 58-31 58 0" className="artTint"/>
            <g className="artBob"><circle cx="43" cy="30" r="17" className="artSolid"/><path d="m35 30 6 6 10-12" className="artInverse"/></g>
        </>;
        case "personalization": return <>
            <rect x="-58" y="-40" width="116" height="80" rx="20" className="artPaper"/>
            <path d="M-44 13 0-25 44 13v13h-88Z" className="artTint"/>
            <g className="artBob"><circle cx="-26" cy="-20" r="10" className="artSolid"/></g>
            <g className="artSway"><path d="m13 40 38-62 11 7-38 62Z" className="artSolid"/><path d="m13 40-4 14 15-7" className="artLine"/></g>
        </>;
        case "habits": return <>
            <rect x="-50" y="-43" width="100" height="89" rx="20" className="artPaper"/>
            <path d="M-50-13H50M-25-50v18m50-18v18" className="artLine"/>
            {[-27,0,27].map((x,i)=><g key={x}><circle cx={x} cy="4" r="6" className={`artSolid artPulse artDelay${i}`}/><circle cx={x} cy="27" r="6" className="artTint"/></g>)}
            <g className="artBob"><circle cx="43" cy="34" r="19" className="artSolid"/><path d="m33 34 7 7 13-16" className="artInverse"/></g>
        </>;
        case "chats": return <>
            <g className="artBob"><path d="M-58-40h72a16 16 0 0 1 16 16v25a16 16 0 0 1-16 16h-40l-21 14 3-14h-14a16 16 0 0 1-16-16v-25a16 16 0 0 1 16-16Z" className="artPaper"/>
                <path d="M-51-18H8M-51-3h39" className="artLine"/></g>
            <g className="artBob artDelay1"><path d="M-5-1h54a15 15 0 0 1 15 15v18a15 15 0 0 1-15 15h-4l3 11-18-11H-5a15 15 0 0 1-15-15V14A15 15 0 0 1-5-1Z" className="artSolid"/>
                {[0,20,40].map((x,i)=><circle key={x} cx={x} cy="23" r="3.5" className={`artWhite artPulse artDelay${i}`}/>)}</g>
        </>;
        case "notifications": return <>
            <g className="artSway"><path d="M-35 22c12-13 7-24 10-39 5-31 45-31 50 0 3 15-2 26 10 39Z" className="artPaper"/><path d="M-10 34c3 13 17 13 20 0M0-51v9" className="artLine"/></g>
            <path d="M-49-27q-14 20 0 40M49-27q14 20 0 40" className="artLine artPulse"/>
            <circle cx="29" cy="-34" r="12" className="artSolid artBob"/>
        </>;
        case "security": return <>
            <path d="M0-53c18 12 36 15 49 17v32c0 28-19 46-49 58-30-12-49-30-49-58v-32c13-2 31-5 49-17Z" className="artPaper"/>
            <path d="M0-40c13 8 25 11 35 13v24c0 21-14 36-35 45-21-9-35-24-35-45v-24c10-2 22-5 35-13Z" className="artTint"/>
            <path d="m-19 0 13 13 27-29" className="artLine artDraw"/>
        </>;
        case "privacy": return <>
            <path d="M-25-6v-20a25 25 0 0 1 50 0v20" className="artLine"/>
            <rect x="-43" y="-8" width="86" height="61" rx="18" className="artPaper"/>
            <circle cy="16" r="8" className="artSolid artPulse"/><path d="M0 23v12" className="artLine"/>
            <path d="M-68 1v26m-8-13h16M61-34v17m-8-8h16" className="artLine artShimmer"/>
        </>;
        case "about": return <>
            <circle r="51" className="artPaper"/><circle r="38" className="artRing"/>
            <circle r="26" className="artTint"/><path d="m-17 0 11 12 25-26" className="artLine artDraw"/>
            <g className="artOrbit"><circle cx="51" r="7" className="artSolid"/></g>
        </>;
        case "contacts": return <>
            <rect x="-56" y="-34" width="112" height="75" rx="17" className="artPaper"/>
            <path d="m-49-25 49 35 49-35M-49 31l30-24m68 24L19 7" className="artLine"/>
            <g className="artBob"><path d="m15-33 51-22-12 45-15-19-24-4Zm24 4 27-26" className="artSolid"/></g>
        </>;
        case "faq": return <>
            <path d="M-39-45h78a17 17 0 0 1 17 17v51a17 17 0 0 1-17 17H4l-25 17 4-17h-22a17 17 0 0 1-17-17v-51a17 17 0 0 1 17-17Z" className="artPaper"/>
            <path d="M-13-19c0-21 34-21 30 0-2 9-17 9-17 21" className="artLine artDraw"/><circle cy="18" r="3.5" className="artSolid artPulse"/>
        </>;
        case "policy": return <>
            <rect x="-46" y="-51" width="84" height="103" rx="17" className="artPaper"/>
            <path d="M-28-28H18M-28-10H8M-28 8H2M-28 26H-8" className="artLine"/>
            <g className="artBob"><path d="m35-1 27 9v18c0 15-11 26-27 33-16-7-27-18-27-33V8Z" className="artSolid"/><path d="m23 28 8 8 17-20" className="artInverse"/></g>
        </>;
        case "terms": return <>
            <path d="M0-32c-20-15-42-14-61-7v81c24-7 41-8 61 4 20-12 37-11 61-4v-81c-19-7-41-8-61 7Z" className="artPaper"/>
            <path d="M0-32v78M-45-16l28 3m-28 13 28 3m-28 13 28 3M17-13l28-3M17 3l28-3M17 19l28-3" className="artLine"/>
            <path d="M28-42v30l9-7 9 5v-31" className="artSolid artShimmer"/>
        </>;
        case "growth": return <>
            <path d="M-65 45H65" className="artLine"/>
            {[-46,-13,20].map((x,i)=><rect key={x} x={x} y={20-i*22} width="24" height={25+i*22} rx="7" className={`artSolid artBars artDelay${i}`}/>)}
            <path d="m-52-7 35-22 25 6 44-28m-17 0h17v17" className="artLine artDraw"/>
        </>;
        case "future": return <>
            <g className="artBob"><path d="M-17 21c-7-38 12-64 39-73 16 26 14 58-19 80Z" className="artPaper"/>
                <circle cx="10" cy="-21" r="10" className="artTint"/>
                <path d="m-17 0-20 12-4 24 24-15M15 11l8 22-14 19-6-24" className="artSolid"/>
                <path d="m-18 32-12 20m19-17-6 12" className="artLine artPulse"/></g>
            <path d="M-51-36v14m-7-7h14M51 10v14m-7-7h14" className="artLine artShimmer"/>
        </>;
        case "community": return <>
            <path d="M-42-7 0 27 42-7" className="artLine"/>
            {[-43,0,43].map((x,i)=><g key={x} className={`artBob artDelay${i}`}>
                <circle cx={x} cy={i===1?-18:-33} r="13" className="artPaper"/>
                <path d={`M${x-20} ${i===1?24:9}c0-29 40-29 40 0Z`} className="artSolid"/>
            </g>)}
        </>;
    }
}

export default function SectionArt({ theme, section, mini = false }: { theme?: ArtTheme; section?: string; mini?: boolean }) {
    const id = useId().replace(/:/g, "");
    const ref = useRef<HTMLDivElement>(null);
    const [ visible, setVisible ] = useState(false);
    const kind = theme || themes[section || ""] || "general";
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return <div ref={ref} className={`sectionArt ${mini ? "sectionArt--mini" : ""} ${visible ? "isVisible" : ""}`} aria-hidden="true">
        <svg viewBox="0 0 360 176" fill="none" focusable="false">
            <defs>
                <linearGradient id={`${id}paint`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--accent)"/><stop offset="1" stopColor="var(--grad)"/></linearGradient>
                <clipPath id={`${id}safe`}><rect x="4" y="4" width="352" height="168" rx="24"/></clipPath>
            </defs>
            <g clipPath={`url(#${id}safe)`} style={{ "--art-paint": `url(#${id}paint)` } as React.CSSProperties}>
                <ellipse cx="180" cy="89" rx="115" ry="65" className="artWash"/>
                <ellipse cx="180" cy="151" rx="65" ry="5" className="artShadow"/>
                <path d="M42 105C76 145 88 28 137 45M223 132c43 23 45-97 95-54" className="artTrail"/>
                <g className="artBob artDelay1"><rect x="47" y="59" width="38" height="38" rx="13" className="artPaper"/><path d="m58 78 6 6 11-13" className="artLine"/></g>
                <g className="artBob artDelay2"><rect x="277" y="92" width="36" height="36" rx="12" className="artPaper"/><path d="M288 110h14m-7-7v14" className="artLine"/></g>
                <g transform="translate(180 87)"><Motif theme={kind}/></g>
                <circle cx="98" cy="129" r="4" className="artSolid artPulse"/>
                <circle cx="262" cy="44" r="5" className="artSolid artPulse artDelay1"/>
                <path d="M101 35v10m-5-5h10M250 136v10m-5-5h10" className="artLine artShimmer"/>
            </g>
        </svg>
    </div>;
}
