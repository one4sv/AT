import { useRef } from "react";
import { MoonStarsIcon, PlusCircle, SunIcon } from "@phosphor-icons/react";
import defaultBg from "../../../../assets/pics/defaultBg.png";
import monoBg from "../../../../assets/pics/monoBg.png";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import RadioGroup from "../../../../components/ts/RadioGroup";
import PreviewAccent from "../PreviewAccent.tsx";
import { useTranslation } from "react-i18next";

export default function PersSettingTab() {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();
    const { isDark, accent, bg, bgUrl, decor, grad } = useSettings();
    const { setNewTheme, setNewAccent, setNewBg, setNewDecor, setNewGrad } = useUpSettings();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const themeArr = [
        { label: t("personalization.dark"), value: "dark", icon: MoonStarsIcon },
        { label: t("personalization.light"), value: "light", icon: SunIcon },
    ];

    const decorArr = [
        { label: t("personalization.default"), value: "default" },
        { label: t("personalization.glass"), value: "glass" },
    ];

    const accentArr = [
        { value: "poison", dark: "#14b314", light: "#00ad09" },
        { value: "space", dark: "#8b12ee", light: "#a066ff" },
        { value: "apple", dark: "#ff3b3b", light: "#ff3333" },
        { value: "sky", dark: "#007bff", light: "#3399ff" },
        { value: "orange", dark: "#FF6B00", light: "#FF6B00" },
        { value: "inversion", dark: "#fff", light: "#fff" },
        { value: "abyss", dark: "#000", light: "#000" },
    ];
    const gradArr = [
        { value: "meadow", dark: "#14b314", light: "#00ad09" },
        { value: "violet", dark: "#8b12ee", light: "#a066ff" },
        { value: "rubin", dark: "#ff3b3b", light: "#ff3333" },
        { value: "ocean", dark: "#007bff", light: "#3399ff" },
        { value: "ginger", dark: "#FF6B00", light: "#FF6B00" },
        { value: "mono", dark: "#fff", light: "#fff" },
        { value: "void", dark: "#000", light: "#000" },
    ];

    const bgArr = [
        { label: t("personalization.contourShapes"), value: "default", pick: defaultBg },
        { label: t("personalization.solidColor"), value: "color", pick: monoBg },
    ];

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("personalization.appearance")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">{t("personalization.theme")}</div>
                    <RadioGroup list={themeArr} val={isDark ? "dark" : "light"} newVal={setNewTheme} />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">{t("personalization.accentColors")}</div>
                    <PreviewAccent />
                    <div className="accentSelector">
                        <span className="colorTitle">{t("personalization.mainColor")}</span>
                        <div className="accentSelectorWrapper">
                            {accentArr.map((a) => (
                                <div 
                                    className={`accentPicker ${accent === a.value ? "active" : ""}`} 
                                    key={a.value} 
                                    onClick={() => setNewAccent(a.value)} 
                                    style={{ 
                                        backgroundColor: isDark ? a.dark : a.light,
                                        borderColor: accent === a.value 
                                            ? isDark 
                                                ? a.dark 
                                                : a.light 
                                            : "none"
                                    }}
                                >
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="accentSelector">
                        <span className="colorTitle">{t("personalization.gradient")}</span>
                        <div className="accentSelectorWrapper">
                            {gradArr.map((a) => (
                                <div 
                                    className={`accentPicker ${grad === a.value ? "active" : ""}`} 
                                    key={a.value} 
                                    onClick={() => setNewGrad(a.value)} 
                                    style={{ 
                                        backgroundColor: isDark ? a.dark : a.light,
                                        borderColor: grad === a.value 
                                            ? isDark 
                                                ? a.dark 
                                                : a.light 
                                            : "none"
                                    }}
                                >
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">{t("personalization.decor")}</div>
                    <RadioGroup list={decorArr} val={decor} newVal={setNewDecor} />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">{t("personalization.background")}</div>
                    <div className="bgPicker">
                        <div className="bgPick">
                            <div className="bgCustom bgMini" onClick={() => fileInputRef.current?.click()}>
                                <input
                                    type="file"
                                    className="accPicksfileInput"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        if (!e.target.files) return;
                                        setBlackout({ seted: true, module: "BgHandler", bg: e.target.files[0] });
                                    }}
                                />
                                <PlusCircle />
                            </div>
                            <span>{t("personalization.addCustom")}</span>
                        </div>
                        {bgArr.map((b, i) => (
                            <div className="bgPick" key={i} onClick={() => setNewBg(b.value)}>
                                <img src={b.pick} className={`bgImg bgMini ${b.value === bg ? "choosen" : ""}`} />
                                <span className={b.value === bg ? "bgSpanChoosen" : ""}>{b.label}</span>
                            </div>
                        ))}
                        {bgUrl ? (
                            <div className="bgPick" onClick={() => setNewBg("custom")}>
                                <img src={bgUrl} className={`bgImg bgMini ${bg === "custom" ? "choosen" : ""}`} />
                                <span className={bg === "custom" ? "bgSpanChoosen" : ""}>{t("personalization.yourBg")}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}