export default function BetaArt({ background = false }: { background?: boolean }) {
    return <svg className={background ? "betaArt betaArt--background" : "betaArt"} viewBox="0 0 240 180" fill="none" aria-hidden="true" focusable="false">
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <g className="betaArtOrbit">
                <ellipse cx="120" cy="90" rx="100" ry="61" strokeDasharray="3 12"/>
                <circle cx="212" cy="67" r="6"/>
                <path d="M29 111v12m-6-6h12M177 29v12m-6-6h12"/>
            </g>
            <g className="betaArtFloat">
                <path d="M99 39h42m-35 0v38l-35 56c-5 9 1 18 11 18h76c10 0 16-9 11-18l-35-56V39"/>
                <path d="M91 104c19-13 35 13 58 0M95 133l10-10 10 10 25-25"/>
                <circle cx="118" cy="91" r="3"/>
                <circle cx="129" cy="63" r="2"/>
            </g>
            <path d="m48 47 7-12 7 12-7 12Z M180 132l9 5 9-5v-10l-9-5-9 5Z"/>
        </g>
    </svg>;
}
