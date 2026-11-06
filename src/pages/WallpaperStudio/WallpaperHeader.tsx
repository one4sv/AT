import { Film, LayoutGrid, Palette, WandSparkles, Sun, CircleCheck } from "lucide-react";
import { useSettings } from "../../components/hooks/SettingsHook";
import { WallpaperLogoIcon, WallpaperFillIcon } from "../../components/ts/utils/WallpaperCapabilityIcons";
import { TextIndentIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import { useContextMenu } from "../../components/hooks/ContextMenuHook";
import useHeaderMenuGestures from "../../components/hooks/utils/useHeaderMenuGestures";
import { isPhotographicScene, supportsBackgroundMotion } from "../../components/ts/utils/BackgroundScene";
import "../../scss/header.scss";

export default function WallpaperHeader({ id, name, applied, onApply }: {
    id: string;
    name: string;
    applied: boolean;
    onApply: () => void;
}) {
    const { t } = useTranslation("settings");
    const { wallpaperStyle } = useSettings();
    const { openSideMenu } = useSideMenu();
    const { openMenu } = useContextMenu();
    const headerGestures = useHeaderMenuGestures();
    const themeAware = !isPhotographicScene(id) && id !== "custom" && id !== "color" && id !== "logo";

    const openQuickActions = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        openMenu(event.clientX, event.clientY, "headerQuickAction", { id: "headerQuickAction" });
    };

    return <div className="headerDiv wallpaperHeader" {...headerGestures}>
        <button type="button" className="headerButt wallpaperHeaderMenu"
            data-header-gesture="quick"
            title={t("backgroundLibrary.openSideMenu")}
            aria-label={t("backgroundLibrary.openSideMenu")}
            onMouseDown={event => event.stopPropagation()}
            onContextMenu={openQuickActions}
            onClick={() => openSideMenu()}>
            <TextIndentIcon/>
        </button>
        <div className="header wallpaperHeaderInfo" data-header-gesture="quick"
            onContextMenu={openQuickActions}>
            <span className="wallpaperHeaderName headerTitle" title={name}>{name}</span>
            <span className="wallpaperHeaderCapabilities">
                {(id === "color" || id === "logo") && <span title={t("backgroundLibrary.backgroundFill")}><WallpaperFillIcon gradient={wallpaperStyle.fillMode === "gradient"}/></span>}
                {(id === "color" || id === "logo") && (wallpaperStyle.logoEnabled || id === "logo") && <span title={t("backgroundLibrary.logo")}><WallpaperLogoIcon/></span>}
                {(id === "color" || id === "logo") && (wallpaperStyle.logoEnabled || id === "logo") && wallpaperStyle.logoGlow > 0 && <span title={t("backgroundLibrary.logoGlow")}><Sun size={16}/></span>}
                {supportsBackgroundMotion(id) && <span title={t("backgroundLibrary.motionAvailable")}><Film size={16}/></span>}
                {themeAware && <span title={t("backgroundLibrary.themeAware")}><Palette size={16}/></span>}
                {id === "art" && <span title={t("backgroundLibrary.appearanceAware")}><WandSparkles size={16}/></span>}
                {(id === "art" || id === "default") &&
                    <span title={t("backgroundLibrary.patternAvailable")}><LayoutGrid size={16}/></span>}
            </span>
        </div>
        <button type="button" className={`headerButt wallpaperHeaderApply ${applied ? "active" : ""}`}
            title={t(applied ? "backgroundLibrary.selected" : "backgroundLibrary.apply")}
            aria-label={t(applied ? "backgroundLibrary.selected" : "backgroundLibrary.apply")}
            aria-pressed={applied}
            onClick={onApply}>
            <CircleCheck size={25}/>
        </button>
    </div>;
}
