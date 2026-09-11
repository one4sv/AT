import { useRef } from "react";
import { MoonStarsIcon, PlusCircle, SunIcon } from "@phosphor-icons/react";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import RadioGroup from "../../../../components/ts/RadioGroup";
import PreviewAccent from "../PreviewAccent.tsx";
import { useTranslation } from "react-i18next";
import { useBackIconsPattern } from "../../../../components/hooks/utils/useBackIconsPattern.tsx";
import SeekBar from "../SeekBar.tsx";
import { isMobile } from "react-device-detect";

export default function PersSettingTab() {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();
    const { isDark, accent, bg, bgUrl, decor, grad, blur, layout } = useSettings();
    const { setNewTheme, setNewAccent, setNewBg, setNewDecor, setNewGrad, setNewBlur, setNewLayout } = useUpSettings();
    const backIconsPattern = useBackIconsPattern({
        width: window.innerWidth * 0.08,
        height: window.innerHeight * 0.08,
        minSize: 40,
        maxSize: 80,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themeArr = [
        { label: t("personalization.dark"), value: "dark", icon: MoonStarsIcon },
        { label: t("personalization.light"), value: "light", icon: SunIcon },
    ];

    const decorArr = [
        { label: t("personalization.default"), value: "default" },
        { label: t("personalization.glass"), value: "glass" },
    ];    
    const layoutArr = [
        { label: "Всегда", value: "always" },
        { label: "По нажатию кнопки", value: "hidden" },
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
    console.log(blur)
    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingInnerWrapper">
                    <div className="settingHeader">{t("personalization.theme")}</div>
                    <RadioGroup list={themeArr} val={isDark ? "dark" : "light"} newVal={setNewTheme} />
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingInnerWrapper">
                    <div className="settingHeader">{t("personalization.accentColors")}</div>
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
                                />
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
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingInnerWrapper">
                    <div className="settingHeader">{t("personalization.decor")}</div>
                    <RadioGroup list={decorArr} val={decor} newVal={setNewDecor} />
                </div>
                {decor === "glass" ? (
                    <div className="settingInnerWrapper">
                        <div className="settingSpan">
                            Степень размытия
                        </div>
                        <SeekBar min={2} max={36} value={blur} unit="px" step={1} onChange={setNewBlur} />
                    </div>
                ) : ""}
            </div>
            <div className="settingInnerDiv">
                <div className="settingInnerWrapper">
                    <div className="settingHeader">{t("personalization.background")}</div>
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
                        <div className="bgPick" onClick={() => setNewBg("default")}>
                            <div className={`bgImg bgMini ${bg === "default" ? "choosen" : ""}`}>
                                {backIconsPattern}
                            </div>
                            <span className={bg === "default" ? "bgSpanChoosen" : ""}>{t("personalization.contourShapes")}</span>
                        </div>                        
                        <div className="bgPick" onClick={() => setNewBg("color")}>
                            <div className={`bgImg bgMini ${bg === "color" ? "choosen" : ""}`} />
                            <span className={bg === "color" ? "bgSpanChoosen" : ""}>{t("personalization.solidColor")}</span>
                        </div>
                        {bgUrl ? (
                            <div className="bgPick" onClick={() => setNewBg("custom")}>
                                <img src={bgUrl} className={`bgImg bgMini ${bg === "custom" ? "choosen" : ""}`} />
                                <span className={bg === "custom" ? "bgSpanChoosen" : ""}>{t("personalization.yourBg")}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {!isMobile ? (
                <div className="settingInnerDiv">
                    <div className="settingInnerWrapper">
                        <div className="settingHeader">
                            Боковое меню
                        </div>
                        <RadioGroup list={layoutArr} val={layout} newVal={setNewLayout} />
                    </div>
                </div>
            ) : ""}
            
        </div>
    );
}