import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import { api } from "../../../../components/ts/api";
import Toggler from "../../../../components/ts/Toggler";
import SeekBar from "../SeekBar";
import HighlightText from "../../../../components/ts/HighlightText";
import type { BackgroundEffects } from "../../../../components/context/SettingsContext";

export default function BackgroundEffectsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { bgEffects, setBgEffects, refetchSettings } = useSettings();
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

    const filters: BackgroundEffects["filter"][] = ["none", "grayscale", "sepia", "invert", "contrast", "saturate"];

    return (
        <div className="settingInnerDiv" data-setting-id="backgroundEffects">
            <div className="settingHeader"><HighlightText text={t("backgroundLibrary.title")} search={search}/></div>
            <div className="settingInnerWrapper">
                <div className="settingSpan"><HighlightText text={t("backgroundLibrary.blur")} search={search}/>: {bgEffects.blur}px</div>
                <SeekBar id="backgroundBlur" min={0} max={30} value={bgEffects.blur}
                    onChange={value => update({ ...bgEffects, blur: value })} disabled={false} step={1}/>
            </div>
            <div className="settingInnerList">
                <div className="settingTogglerDiv" onClick={() => update({ ...bgEffects, movement: !bgEffects.movement })}>
                    <HighlightText text={t("backgroundLibrary.movement")} search={search}/>
                    <Toggler state={bgEffects.movement}/>
                </div>
                <div className="settingSpan"><HighlightText text={t("backgroundLibrary.filter")} search={search}/></div>
                <div className="backgroundEffectsFilters">
                    {filters.map(filter => (
                        <button type="button" key={filter} className={bgEffects.filter === filter ? "active" : ""}
                            onClick={() => update({ ...bgEffects, filter })}>
                            {t(`backgroundLibrary.${filter}`)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
