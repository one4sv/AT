import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { supportsBackgroundMotion } from "../ts/utils/BackgroundScene";
import type { BackgroundEffects } from "../context/SettingsContext";
import { ContourPatternPicker } from "../../pages/Settings/components/SettingsTabs/ContourPatternPicker";
import SeekBar from "../../pages/Settings/components/SeekBar";
import Toggler from "../ts/Toggler";
import WallpaperColorControls from "./WallpaperColorControls";
import "./WallpaperSettings.scss";

export default function WallpaperSettings() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { bg, bgEffects, setBgEffects, contourPattern, setContourPattern, contourSize, setContourSize,
        artPattern, setArtPattern, artSize, setArtSize, refetchSettings } = useSettings();
    const { showNotification } = useNote();
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentId = blackout.options?.id ?? bg;
    const motionAvailable = supportsBackgroundMotion(currentId);
    const filters: BackgroundEffects["filter"][] = ["none", "grayscale", "sepia", "invert", "contrast", "saturate"];

    useEffect(() => () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
    }, []);

    const updateEffects = (next: BackgroundEffects) => {
        setBgEffects(next);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                const result = await api.post("updatesettings", { bg_effects: next });
                if (!result.data?.success) throw new Error();
            } catch {
                showNotification("error", t("backgroundLibrary.error"));
                void refetchSettings();
            }
        }, 450);
    };

    return (
        <div className="wallpaperSettingsModal" role="dialog" aria-modal="true"
            aria-label={t("backgroundLibrary.previewSettings")}>
            <div className="wallpaperSettingsModalHeader">
                <span>{t("backgroundLibrary.previewSettings")}</span>
            </div>
            <div className="wallpaperSettingsModalScroll">
                {(currentId === "color" || currentId === "logo") && <WallpaperColorControls target="fill"/>}
                {currentId === "logo" && <WallpaperColorControls target="logo"/>}
                {currentId === "default" && <ContourPatternPicker value={contourPattern}
                    onChange={setContourPattern} size={contourSize} onSizeChange={setContourSize}/>}
                {currentId === "art" && <ContourPatternPicker value={artPattern}
                    onChange={setArtPattern} size={artSize} onSizeChange={setArtSize} subject="art"/>}
                <div className="backgroundFullscreenControl">
                    <span>{t("backgroundLibrary.blurBackground")}</span>
                    <SeekBar id="studioBlur" min={0} max={30} step={1} unit="px" value={bgEffects.blur} disabled={false}
                        onChange={blur => updateEffects({ ...bgEffects, blur })}/>
                </div>
                <button type="button" className={"backgroundFullscreenMovement" + (!motionAvailable ? " disabled" : "")}
                    disabled={!motionAvailable}
                    onClick={() => updateEffects({ ...bgEffects, movement: !bgEffects.movement })}>
                    {t("backgroundLibrary.movement")}
                    <Toggler state={motionAvailable && bgEffects.movement} disable={!motionAvailable}/>
                </button>
                <div className="backgroundFullscreenControl">
                    <span className={!motionAvailable ? "disabled" : ""}>{t("backgroundLibrary.speed")}</span>
                    <SeekBar id="studioSpeed" min={0} max={3} step={.25} unit="×"
                        value={bgEffects.speed} disabled={!motionAvailable}
                        onChange={speed => updateEffects({ ...bgEffects, speed })}/>
                </div>
                <div className="backgroundFullscreenControl">
                    <span>{t("backgroundLibrary.filters")}</span>
                    <div className="backgroundEffectsFilters wallpaperSettingsFilters">
                        {filters.map(filter => (
                            <button type="button" key={filter} data-filter={filter}
                                className={bgEffects.filter === filter ? "active" : ""}
                                onClick={() => updateEffects({ ...bgEffects, filter })}>
                                {t("backgroundLibrary." + filter)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <button type="button" className="wallpaperSettingsModalClose"
                onClick={() => setBlackout({ seted: false })}>
                {t("backgroundLibrary.previewBackgrounds")}
            </button>
        </div>
    );
}
