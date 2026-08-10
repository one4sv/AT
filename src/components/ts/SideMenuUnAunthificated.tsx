import { isMobile } from "react-device-detect";
import { Link } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";
import { GhostIcon, MoonStarsIcon, SunDimIcon } from "@phosphor-icons/react";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useSettings } from "../hooks/SettingsHook";
import { useTranslation } from "react-i18next";

interface SMUA {
    ref: React.RefObject<HTMLDivElement | null>,
    onTouchS: (e: React.TouchEvent<Element>) => void,
    onTouchM: (e: React.TouchEvent<Element>) => void,
    onTouchE: (e: React.TouchEvent<Element>) => void,
    translateX: number,
    isDragging: boolean
}

export default function SideMenuUnAunthificated ({ref, onTouchS, onTouchM, onTouchE, translateX, isDragging}: SMUA) {
    const { t } = useTranslation("common")
    const { showSideMenu } = useSideMenu()
    const { setNewTheme } = useUpSettings()
    const { isDark } = useSettings()

    return (
        <div className={`sideMenu ${isMobile ? "mobileSM" : ""} ${showSideMenu ? "open" : ""}`} 
            ref={ref}
            onTouchStart={isMobile ? onTouchS : undefined}
            onTouchMove={isMobile ? onTouchM : undefined}
            onTouchEnd={isMobile ? onTouchE : undefined} style={{
                transform: isMobile ? `translateX(${translateX}%)` : "none",
                transition: isDragging ? "none" : "transform 0.4s ease"
            }}
        >
            <div className="sideMenuUnAthorised">
                <span><GhostIcon /> {t("sideMenu.notLoggedIn")}</span>
                <Link to={'/sign'} className="greenButt">{t("sideMenu.signIn")}</Link>
            </div>
            <div className="changeSignTheme" onClick={() => setNewTheme(isDark ? "light" : "dark")}>
                {isDark && (
                    <MoonStarsIcon />
                )}            
                {!isDark && (
                    <SunDimIcon />
                )}
            </div>
        </div>
    )
}