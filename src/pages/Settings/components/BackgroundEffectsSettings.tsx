import { useTranslation } from "react-i18next";
import { useSettings } from "../../../components/hooks/SettingsHook";
import Toggler from "../../../components/ts/Toggler";
import SeekBar from "./SeekBar";
import HighlightText from "../../../components/ts/HighlightText";
import type { BackgroundEffects } from "../../../components/context/SettingsContext";
import { supportsBackgroundMotion } from "../../../components/ts/utils/BackgroundScene";
import { ContourPatternPicker } from "./ContourPatternPicker";
import WallpaperColorControls from "../../../components/modules/WallpaperColorControls";

export default function BackgroundEffectsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { bg, bgEffects, setBgEffects, contourPattern, setContourPattern, contourSize, setContourSize, artPattern, setArtPattern, artSize, setArtSize } = useSettings();
    const update = (next: BackgroundEffects) => {
        setBgEffects(next);
    };

    const motionAvailable = supportsBackgroundMotion(bg);
    const filters: BackgroundEffects["filter"][] = ["none", "grayscale", "sepia", "invert", "contrast", "saturate"];

    return (
        <>
            {(bg === "color" || bg === "logo") && <WallpaperColorControls target="fill"/>}
            {bg === "default" && <ContourPatternPicker value={contourPattern} onChange={setContourPattern} size={contourSize} onSizeChange={setContourSize}/>}
            {bg === "art" && <ContourPatternPicker value={artPattern} onChange={setArtPattern} size={artSize} onSizeChange={setArtSize} subject="art"/>}
            <div className="settingInnerWrapper" data-setting-id="backgroundBlur">
                <div className="settingSpan">
                    <HighlightText text={t("backgroundLibrary.blurBackground")} search={search}/>
                </div>
                <SeekBar id="backgroundBlur" min={0} max={30} value={bgEffects.blur} unit="px"
                    onChange={value => update({ ...bgEffects, blur: value })} disabled={false} step={1}/>
            </div>
            <div className="settingInnerWrapper" data-setting-id="backgroundMovement">
                <div className={`settingTogglerDiv ${!motionAvailable ? "disabled" : ""}`}
                    onClick={() => { if (motionAvailable) update({ ...bgEffects, movement: !bgEffects.movement }); }}>
                    <HighlightText text={t("backgroundLibrary.movement")} search={search}/>
                    <Toggler state={motionAvailable && bgEffects.movement} disable={!motionAvailable}/>
                </div>
            </div>
            <div className="settingInnerWrapper" data-setting-id="backgroundSpeed">
                <div className={`settingSpan ${!motionAvailable ? "disabled" : ""}`}>
                    <HighlightText text={t("backgroundLibrary.speed")} search={search}/>
                </div>
                <SeekBar id="backgroundSpeed" min={0} max={3} step={0.25} value={bgEffects.speed ?? 1} unit="×"
                    disabled={!motionAvailable}
                    onChange={speed => update({ ...bgEffects, speed })}/>
            </div>
            <div className="settingInnerWrapper">
                <div className="settingSpan" data-setting-id="backgroundFilters">
                    <HighlightText text={t("backgroundLibrary.filters")} search={search}/>
                </div>
                <div className="backgroundEffectsFilters">
                    {filters.map(filter => (
                        <button type="button" key={filter} data-filter={filter}
                            className={bgEffects.filter === filter ? "active" : ""}
                            onClick={() => update({ ...bgEffects, filter })}>
                            {t(`backgroundLibrary.${filter}`)}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
