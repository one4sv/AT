import { MoonStarsIcon, SunDimIcon } from "@phosphor-icons/react";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../components/hooks/UpdateSettingsHook";

export default function LandingFooter() {
    const { setNewTheme } = useUpSettings()
    const { theme } = useSettings()
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark =
        theme === "dark" ||
        (theme === "system" && systemDark);
        
    return (
        <div className="landingFooter">
            <div>Achieve Together © 2025</div>
            <div>
                <a href="">О нас</a>
                <a href="">Условия</a>
                <a href="">Конфиденциальность</a>
                <span>Русский</span>
                <div className="changeSignTheme" onClick={()=>setNewTheme(isDark ? "light" : "dark")}>
                    {isDark && (
                        <MoonStarsIcon />
                    )}            
                    {!isDark && (
                        <SunDimIcon  />
                    )}
                </div>
            </div>
        </div>
    )
}