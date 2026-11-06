import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { applyCustomPalette, getCustomHex, validHex, type PalettePart } from "../ts/utils/customPalette";
import "./CustomThemeColor.scss";

const getInitialHex = (part: PalettePart, selected: string) => {
    if (selected === "custom") return getCustomHex(part);

    const color = getComputedStyle(document.documentElement)
        .getPropertyValue(part === "accent" ? "--accent" : "--grad").trim();
    const expanded = /^#[0-9a-fA-F]{3}$/.test(color)
        ? "#" + [...color.slice(1)].map(char => char + char).join("")
        : color;

    return validHex(expanded) ? expanded : getCustomHex(part);
};

export default function CustomThemeColor() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { accent, grad, wallpaperStyle, setWallpaperStyle } = useSettings();
    const forLogo = blackout.options?.id === "wallpaperLogoColors";
    const forFill = blackout.options?.id === "wallpaperFillColors";
    const wallpaperColors = forLogo || forFill;
    const { setNewAccent, setNewGrad } = useUpSettings();

    const [ accentHex, setAccentHex ] = useState(() => wallpaperColors ? (forLogo ? wallpaperStyle.logoColor : wallpaperStyle.fillColor) : getInitialHex("accent", accent));
    const [ gradHex, setGradHex ] = useState(() => wallpaperColors ? (forLogo ? wallpaperStyle.logoGrad : wallpaperStyle.fillGrad) : getInitialHex("grad", grad));
    const validAccent = validHex(accentHex);
    const validGrad = validHex(gradHex);
    const title = t(wallpaperColors ? (forLogo ? "backgroundLibrary.logoPalette" : "backgroundLibrary.fillPalette") : "personalization.customColors");

    const save = () => {
        if (!validAccent || !validGrad) return;
        if (wallpaperColors) {
            setWallpaperStyle(current => forLogo ? {
                ...current, logoColor: accentHex.toLowerCase(), logoGrad: gradHex.toLowerCase()
            } : {
                ...current, fillColor: accentHex.toLowerCase(), fillGrad: gradHex.toLowerCase()
            });
            setBlackout({ seted: false });
            return;
        }

        localStorage.setItem("customAccentHex", accentHex.toLowerCase());
        localStorage.setItem("customGradHex", gradHex.toLowerCase());
        setNewAccent("custom");
        setNewGrad("custom");
        applyCustomPalette("custom", "custom");
        setBlackout({ seted: false });
    };

    return <div className="customThemeColor" role="dialog" aria-modal="true" aria-label={title}>
        <div className="settingHeader">{title}</div>
        {!wallpaperColors && <div className="customThemeColorPreview" aria-hidden="true"
            style={{ background: `linear-gradient(135deg, ${validAccent ? accentHex : "var(--accent)"}, ${validGrad ? gradHex : "var(--grad)"})` }}/>
        <div className="customThemeColorGroup">
            <div className="customThemeColorLabel">{t("personalization.mainColor")}</div>
            <div className="customThemeColorInputs">
                <input type="color" value={validAccent ? accentHex : getCustomHex("accent")}
                    onChange={event => setAccentHex(event.target.value)}
                    aria-label={`${t("personalization.pickColor")}: ${t("personalization.mainColor")}`}/>
                <input type="text" value={accentHex} maxLength={7} spellCheck={false}
                    onChange={event => setAccentHex(event.target.value)}
                    aria-label={`${t("personalization.hexColor")}: ${t("personalization.mainColor")}`}
                    placeholder="#ff6b00"/>
            </div>
        </div>
        <div className="customThemeColorGroup">
            <div className="customThemeColorLabel">{t("personalization.gradient")}</div>
            <div className="customThemeColorInputs">
                <input type="color" value={validGrad ? gradHex : getCustomHex("grad")}
                    onChange={event => setGradHex(event.target.value)}
                    aria-label={`${t("personalization.pickColor")}: ${t("personalization.gradient")}`}/>
                <input type="text" value={gradHex} maxLength={7} spellCheck={false}
                    onChange={event => setGradHex(event.target.value)}
                    aria-label={`${t("personalization.hexColor")}: ${t("personalization.gradient")}`}
                    placeholder="#a122da"/>
            </div>
        </div>
        <button type="button" className="customThemeColorSave"
            disabled={!validAccent || !validGrad} onClick={save}>{t("personalization.saveColors")}</button>
    </div>;
}
