import { CircleHelp, Film, LayoutGrid, Palette, Sun, WandSparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { WallpaperFillIcon } from "../ts/utils/WallpaperCapabilityIcons";
import ruSettings from "../../i18n/locales/ru/settings.json";
import enSettings from "../../i18n/locales/en/settings.json";
import "./scss/BackgroundHelp.scss";

type HelpKey = "help" | "helpTitle" | "helpIntro" | "helpMotion" | "helpTheme" |
    "helpAppearance" | "helpPattern" | "helpFill" | "helpGlow" | "helpClose";

function useBackgroundHelpText() {
    const { t, i18n } = useTranslation("settings");
    const dictionary = (i18n.resolvedLanguage ?? i18n.language).startsWith("ru")
        ? ruSettings.backgroundLibrary
        : enSettings.backgroundLibrary;

    return (key: HelpKey) => t(`backgroundLibrary.${key}`, {
        defaultValue: dictionary[key]
    });
}

export function BackgroundHelpButton({ className = "" }: { className?: string }) {
    const helpText = useBackgroundHelpText();
    const { setBlackout } = useBlackout();

    return (
        <button type="button" className={`backgroundHelpButton ${className}`}
            aria-label={helpText("help")} title={helpText("help")}
            onClick={() => setBlackout({ seted: true, module: "BackgroundHelp" })}>
            <CircleHelp size={21}/>
        </button>
    );
}

export default function BackgroundHelp() {
    const { t } = useTranslation("settings");
    const helpText = useBackgroundHelpText();
    const { setBlackout } = useBlackout();

    const items = [
        { icon: <WallpaperFillIcon/>, title: t("backgroundLibrary.backgroundFill"), detail: helpText("helpFill") },
        { icon: <LayoutGrid size={20}/>, title: t("backgroundLibrary.patternAvailable"), detail: helpText("helpPattern") },
        { icon: <Sun size={20}/>, title: t("backgroundLibrary.logoGlow"), detail: helpText("helpGlow") },
        { icon: <Film size={20}/>, title: t("backgroundLibrary.motionAvailable"), detail: helpText("helpMotion") },
        { icon: <Palette size={20}/>, title: t("backgroundLibrary.themeAware"), detail: helpText("helpTheme") },
        { icon: <WandSparkles size={20}/>, title: t("backgroundLibrary.appearanceAware"), detail: helpText("helpAppearance") }
    ];

    return (
        <div className="backgroundHelpModal" role="dialog" aria-modal="true" aria-label={helpText("helpTitle")}>
            <div className="backgroundHelpTitle">{helpText("helpTitle")}</div>
            <p>{helpText("helpIntro")}</p>
            <div className="backgroundHelpItems">
                {items.map(item => (
                    <div className="backgroundHelpItem" key={item.title}>
                        <span className="backgroundHelpIcon">{item.icon}</span>
                        <div className="backgroundHelpText">
                            <span>{item.title}</span>
                            <p>{item.detail}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" className="backgroundHelpClose"
                onClick={() => setBlackout({ seted: false })}>
                {helpText("helpClose")}
            </button>
        </div>
    );
}
