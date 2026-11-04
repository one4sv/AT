import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import { api } from "../../../../components/ts/api";
import Toggler from "../../../../components/ts/Toggler";
import SeekBar from "../SeekBar";
import HighlightText from "../../../../components/ts/HighlightText";
import type { BackgroundEffects } from "../../../../components/context/SettingsContext";
import { supportsBackgroundMotion } from "../../../../components/ts/utils/BackgroundScene";

export default function BackgroundEffectsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { bg, bgEffects, setBgEffects, refetchSettings } = useSettings();
    const { showNotification } = useNote();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const update = (next: BackgroundEffects) => {
        setBgEffects(next);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            try {
                const res = await api.post("updatesettings", { bg_effects: next });
                if (!res.data?.success) throw new Error();
            } catch {
                showNotification("error", t("backgroundLibrary.error"));
                void refetchSettings();
            }
        }, 450);
    };

    const motionAvailable = supportsBackgroundMotion(bg);
    const filters: BackgroundEffects["filter"][] = ["none", "grayscale", "sepia", "invert", "contrast", "saturate"];

    return (
        <>
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
                    <Toggler state={motionAvailable && bgEffects.movement}/>
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
        </>
    );
}
