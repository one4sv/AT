import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { applyCustomPalette, getCustomHex, validHex } from "../ts/utils/customPalette";
import "./CustomThemeColor.scss";
export default function CustomThemeColor() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { accent, grad } = useSettings();
    const { setNewAccent, setNewGrad } = useUpSettings();
    const part = blackout.options?.id === "grad" ? "grad" : "accent";
    const title = t(part === "grad" ? "personalization.customGrad" : "personalization.customAccent");
    const [ hex, setHex ] = useState(getCustomHex(part));
    const valid = validHex(hex);
    const save = () => {
        if (!valid) return;
        localStorage.setItem(part === "accent" ? "customAccentHex" : "customGradHex", hex.toLowerCase());
        if (part === "accent") setNewAccent("custom");
        else setNewGrad("custom");
        applyCustomPalette(part === "accent" ? "custom" : accent, part === "grad" ? "custom" : grad);
        setBlackout({ seted: false });
    };
    return <div className="customThemeColor" role="dialog" aria-modal="true"
        aria-label={title}>
        <div className="settingHeader">{title}</div>
        <div className="customThemeColorPreview"
            style={{ background: `linear-gradient(135deg, ${part === "accent" && valid ? hex : "var(--accent)"}, ${part === "grad" && valid ? hex : "var(--grad)"})` }}/>
        <div className="customThemeColorInputs">
            <input type="color" value={valid ? hex : getCustomHex(part)}
                onChange={event => setHex(event.target.value)} aria-label={t("personalization.pickColor")}/>
            <input type="text" value={hex} maxLength={7} spellCheck={false}
                onChange={event => setHex(event.target.value)}
                aria-label={t("personalization.hexColor")} placeholder="#ff6b00"/>
        </div>
        <button type="button" className="customThemeColorSave"
            disabled={!valid} onClick={save}>{t("personalization.saveColor")}</button>
    </div>;
}
