import { useRef } from "react";
import { MoonStarsIcon, PlusCircle, SunIcon } from "@phosphor-icons/react";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import PreviewAccent from "../PreviewAccent.tsx";
import { useTranslation } from "react-i18next";
import { useBackIconsPattern } from "../../../../components/hooks/utils/useBackIconsPattern.tsx";
import SeekBar from "../SeekBar.tsx";
import { isMobile } from "react-device-detect";
import Selector from "../../../../components/ts/Selector.tsx";
import { MirrorRectangular, PaintBucket, PanelLeft, PanelLeftClose } from "lucide-react";
import ColorSelector from "../ColorSelector.tsx";

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
        { label: t("personalization.dark"), value: "dark", icon: MoonStarsIcon, func:setNewTheme },
        { label: t("personalization.light"), value: "light", icon: SunIcon, func:setNewTheme },
    ];

    const decorArr = [
        { label: t("personalization.default"), value: "default", icon:PaintBucket, func:setNewDecor },
        { label: t("personalization.glass"), value: "glass", icon: MirrorRectangular, func:setNewDecor },
    ];    
    const layoutArr = [
        { label: "Всегда", value: "always", func:setNewLayout, icon:PanelLeft },
        { label: "По нажатию кнопки", value: "hidden", func:setNewLayout, icon:PanelLeftClose },
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

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">{t("personalization.theme")}</div>
                <div className="settingInnerWrapper">
                    {/* <RadioGroup list={themeArr} val={isDark ? "dark" : "light"} newVal={setNewTheme} /> */}
                    <Selector arr={themeArr} selected={isDark ? "dark" : "light"}/>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">{t("personalization.accentColors")}</div>    
                <div className="settingInnerWrapper">
                    <PreviewAccent />
                    <div className="colorSelector">
                        <span className="colorTitle">{t("personalization.mainColor")}</span>
                        <ColorSelector arr={accentArr} value={accent} setNew={setNewAccent}/>
                    </div>
                    <div className="colorSelector">
                        <span className="colorTitle">{t("personalization.gradient")}</span>
                        <ColorSelector arr={gradArr} value={grad} setNew={setNewGrad}/>
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">{t("personalization.decor")}</div>
                <div className="settingInnerWrapper">
                        <Selector arr={decorArr} selected={decor}/>
                </div>
                    <div className="settingInnerWrapper">
                        <div className={`settingSpan ${decor !== "glass" ? "disabled" : ""}`}>
                            Степень размытия
                        </div>
                        <SeekBar min={2} max={36} value={blur} unit="px" step={1} onChange={setNewBlur} disabled={decor !== "glass"}/>
                    </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">{t("personalization.background")}</div>
                <div className="settingInnerWrapper">
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
                    <div className="settingHeader">
                        Боковое меню
                    </div>
                    <div className="settingInnerWrapper">
                        <Selector arr={layoutArr} selected={layout}/>
                    </div>
                </div>
            ) : ""}
            
        </div>
    );
}