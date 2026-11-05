import { CircleHelp, Film, LayoutGrid, Palette, WandSparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import "./BackgroundHelp.scss";

export function BackgroundHelpButton({ className = "" }: { className?: string }) {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();

    return (
        <button type="button" className={`backgroundHelpButton ${className}`}
            aria-label={t("backgroundLibrary.help")} title={t("backgroundLibrary.help")}
            onClick={() => setBlackout({ seted: true, module: "BackgroundHelp" })}>
            <CircleHelp size={21}/>
        </button>
    );
}

export default function BackgroundHelp() {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();

    const items = [
        { icon: <Film size={20}/>, title: t("backgroundLibrary.motionAvailable"), detail: t("backgroundLibrary.helpMotion") },
        { icon: <Palette size={20}/>, title: t("backgroundLibrary.themeAware"), detail: t("backgroundLibrary.helpTheme") },
        { icon: <WandSparkles size={20}/>, title: t("backgroundLibrary.appearanceAware"), detail: t("backgroundLibrary.helpAppearance") },
        { icon: <LayoutGrid size={20}/>, title: t("backgroundLibrary.patternAvailable"), detail: t("backgroundLibrary.helpPattern") }
    ];

    return (
        <div className="backgroundHelpModal" role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.helpTitle")}>
            <div className="backgroundHelpTitle">{t("backgroundLibrary.helpTitle")}</div>
            <p>{t("backgroundLibrary.helpIntro")}</p>
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
            <p>{t("backgroundLibrary.helpPreview")}</p>
            <p>{t("backgroundLibrary.helpSelect")}</p>
            <button type="button" className="backgroundHelpClose"
                onClick={() => setBlackout({ seted: false })}>
                {t("backgroundLibrary.helpClose")}
            </button>
        </div>
    );
}
