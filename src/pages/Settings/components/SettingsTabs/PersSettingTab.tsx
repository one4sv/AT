
import { MoonStarsIcon, SunIcon } from "@phosphor-icons/react";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import PreviewAccent from "../PreviewAccent.tsx";
import { useTranslation } from "react-i18next";

import SeekBar from "../SeekBar.tsx";
import { isMobile } from "react-device-detect";
import Selector from "../../../../components/ts/Selector.tsx";
import { MirrorRectangular, PaintBucket, PanelLeft, PanelLeftClose } from "lucide-react";
import ColorSelector from "../ColorSelector.tsx";
import HighlightText from "../../../../components/ts/HighlightText.tsx";
import "../../../../scss/landingBackground.scss";

import SectionArt from "../../../../components/ts/SectionArt";
import BackgroundEffectsSettings from "./BackgroundEffectsSettings";
import { BackgroundScene, type StockScene, isStockScene } from "../../../../components/ts/utils/BackgroundScene";

export default function PersSettingTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { setBlackout } = useBlackout();
    const { isDark, accent, bg, bgUrl, decor, grad, blur, layout } = useSettings();
    const { setNewTheme, setNewAccent, setNewDecor, setNewGrad, setNewBlur, setNewLayout } = useUpSettings();

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
            {!search.trim() && <SectionArt theme="personalization"/>}
            <div className="settingInnerDiv" data-setting-id="theme">
                <div className="settingHeader"><HighlightText text={t("personalization.theme")} search={search} /></div>
                <div className="settingInnerWrapper">
                    {/* <RadioGroup list={themeArr} val={isDark ? "dark" : "light"} newVal={setNewTheme} /> */}
                    <Selector arr={themeArr} selected={isDark ? "dark" : "light"}/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="accent">
                <div className="settingHeader"><HighlightText text={t("personalization.accentColors")} search={search} /></div>    
                <div className="settingInnerWrapper">
                    <PreviewAccent />
                    <div className="colorSelector" data-setting-id="mainColor">
                        <span className="colorTitle"><HighlightText text={t("personalization.mainColor")} search={search} /></span>
                        <ColorSelector arr={accentArr} value={accent} setNew={setNewAccent}/>
                    </div>
                    <div className="colorSelector" data-setting-id="grad">
                        <span className="colorTitle"><HighlightText text={t("personalization.gradient")} search={search} /></span>
                        <ColorSelector arr={gradArr} value={grad} setNew={setNewGrad}/>
                    </div>
                    <button type="button" className={`customPaletteOpen ${accent === "custom" || grad === "custom" ? "active" : ""}`}
                        onClick={() => setBlackout({ seted: true, module: "CustomThemeColor" })}>
                        <span className="customPaletteSwatch" aria-hidden="true"/>
                        {t("personalization.customColors")}
                    </button>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader"><HighlightText text={t("personalization.decor")} search={search} /></div>
                <div className="settingInnerWrapper" data-setting-id="decor">
                    <Selector arr={decorArr} selected={decor}/>
                </div>
                    <div className="settingInnerWrapper">
                        <div className={`settingSpan ${decor !== "glass" ? "disabled" : ""}`}>
                            <HighlightText text="Степень размытия" search={search} />
                        </div>
                        <SeekBar min={2} max={36} value={blur} unit="px" step={1} onChange={setNewBlur} disabled={decor !== "glass"} id="blur"/>
                    </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="bg">
                <div className="settingHeader"><HighlightText text={t("personalization.background")} search={search}/></div>
                <div className="settingInnerWrapper">
                    <button type="button" className="bgManageButton"
                        onClick={() => setBlackout({ seted: true, module: "BackgroundLibrary" })}>
                        {bg === "custom" && bgUrl ?
                            <img className="bgManagePreview" src={bgUrl} alt=""/> :
                            <div className={`bgManagePreview ${bg === "landing" ? "landingBackground" : ""}`}>
                                {isStockScene(bg) &&
                                    <BackgroundScene variant={bg as StockScene}/>}
                            </div>}
                        <span>{t("backgroundLibrary.change")}</span>
                    </button>
                </div>
                <BackgroundEffectsSettings search={search}/>
            </div>
            {!isMobile ? (
                <div className="settingInnerDiv" data-setting-id="layout">
                    <div className="settingHeader">
                        <HighlightText text="Боковое меню" search={search} />
                    </div>
                    <div className="settingInnerWrapper">
                        <Selector arr={layoutArr} selected={layout}/>
                    </div>
                </div>
            ) : ""}
            
        </div>
    );
}
