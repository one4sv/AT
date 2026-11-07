export function WallpaperFillIcon({ gradient }: { gradient: boolean }) {
    return <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="3" width="19" height="18" rx="3"/>
        {gradient ? <>
            <path d="M3.5 17.5 18 4.5"/>
            <path d="M10 20h8a3 3 0 0 0 3-3V9Z" fill="currentColor" opacity=".35" stroke="none"/>
        </> : <rect x="6" y="6.5" width="12" height="11" rx="1.4" fill="currentColor" stroke="none"/>}
    </svg>;
}
