import { useState } from "react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { applyCustomPalette, getCustomHex, validHex } from "../ts/utils/customPalette";
import "./CustomThemeColor.scss";
export default function CustomThemeColor() {
    const { blackout, setBlackout } = useBlackout();
    const { accent, grad } = useSettings();
    const { setNewAccent, setNewGrad } = useUpSettings();
    const part = blackout.options?.id === "grad" ? "grad" : "accent";
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
        aria-label={part === "accent" ? "Свой акцентный цвет" : "Свой цвет градиента"}>
        <div className="settingHeader">{part === "accent" ? "Свой акцентный цвет" : "Свой цвет градиента"}</div>
        <div className="customThemeColorPreview"
            style={{ background: `linear-gradient(135deg, ${part === "accent" && valid ? hex : "var(--accent)"}, ${part === "grad" && valid ? hex : "var(--grad)"})` }}/>
        <div className="customThemeColorInputs">
            <input type="color" value={valid ? hex : getCustomHex(part)}
                onChange={event => setHex(event.target.value)} aria-label="Выбрать цвет"/>
            <input type="text" value={hex} maxLength={7} spellCheck={false}
                onChange={event => setHex(event.target.value)}
                aria-label="HEX" placeholder="#ff6b00"/>
        </div>
        <button type="button" className="customThemeColorSave"
            disabled={!valid} onClick={save}>Сохранить цвет</button>
    </div>;
}
