import useCompactLayout from "../hooks/utils/useCompactLayout";
import { Link } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";
import { GhostIcon, MoonStarsIcon, SunDimIcon } from "@phosphor-icons/react";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useSettings } from "../hooks/SettingsHook";
import { useTranslation } from "react-i18next";
interface SMUA {
    ref: React.RefObject<HTMLDivElement | null>;
    onTouchS: (e: React.TouchEvent<Element>) => void;
    onTouchM: (e: React.TouchEvent<Element>) => void;
    onTouchE: (e: React.TouchEvent<Element>) => void;
    translateX: number;
    onTouchCancel: () => void;
}
export default function SideMenuUnAunthificated({
    ref,
    onTouchS,
    onTouchM,
    onTouchE,
    translateX,
    onTouchCancel
}: SMUA) {
    const isMobile = useCompactLayout();
    const { t } = useTranslation("common");
    const { showSideMenu } = useSideMenu();
    const { setNewTheme } = useUpSettings();
    const {
        isDark,
        layout
    } = useSettings();

    return (
        <div
            className={`sideMenu ${isMobile ? "mobileSM" : ""} ${showSideMenu ? "open" : ""}`}
            ref={ref}
            onTouchStart={isMobile ? onTouchS : undefined}
            onTouchMove={isMobile ? onTouchM : undefined}
            onTouchEnd={isMobile ? onTouchE : undefined}
            onTouchCancel={onTouchCancel}
            style={{
                transform: isMobile || layout === "hidden" || window.innerWidth <= 800 ? `translateX(${translateX}%)` : "none"
            }}
        >
            <div className="sideMenuUnAthorised">
                <span>
                    <GhostIcon />
                    {t("sideMenu.notLoggedIn")}
                </span>
                <Link to={'/sign'} className="greenButt">
                    {t("sideMenu.signIn")}
                </Link>
            </div>
            <div className="changeSignTheme" onClick={() => setNewTheme(isDark ? "light" : "dark")}>
                {isDark && <MoonStarsIcon />}
                {!isDark && <SunDimIcon />}
            </div>
        </div>
    );
}
