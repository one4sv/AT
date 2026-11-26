import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import useModalSlider from "../hooks/utils/useModalSlider";
import { compositionCycleKey } from "../ts/utils/compositions";
import { CompositionPreview } from "../../pages/Settings/components/CompositionsSettings";
import "./scss/CompositionFullscreen.scss";

export default function CompositionFullscreen() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { compositions, applyComposition, setCompositions } = useSettings();
    const items = compositions.items;
    const [index, setIndex] = useState(() => Math.max(0, items.findIndex(item => item.id === blackout.options?.id)));
    const activeIndex = Math.min(index, Math.max(0, items.length - 1));
    const slider = useModalSlider(activeIndex, items.length, "compositions", setIndex);
    const item = items[activeIndex];
    const close = () => setBlackout({ seted: false });
    if (!item) return null;

    return <div className="compositionFullscreen compositionsSettings" role="dialog" aria-label={t("general.compositionPreview")}>
        <button className="compositionFullscreenClose" type="button" onClick={close} aria-label={t("backgroundLibrary.exitPreview")}>
            <XIcon size={24}/>
        </button>
        <div className="compositionFullscreenViewport" ref={slider.viewportRef}>
            <div className="compositionFullscreenTrack" style={{
                transform: `translateX(${-(slider.previewIndex ?? activeIndex) * 100}%)`,
                transition: slider.previewIndex === null ? undefined : "none"
            }}>
                {items.map((composition, position) => <div className="compositionFullscreenSlide" key={composition.id} inert={position !== activeIndex}>
                    <CompositionPreview composition={composition}/>
                </div>)}
            </div>
        </div>
        <div className="compositionFullscreenControls">
            <button type="button" disabled={activeIndex === 0} onClick={() => setIndex(activeIndex - 1)}
                aria-label={t("general.compositionPrevious")}><CaretLeftIcon size={24}/></button>
            <div><span>{item.name}</span><span>{activeIndex + 1} / {items.length}</span></div>
            <button type="button" disabled={activeIndex === items.length - 1} onClick={() => setIndex(activeIndex + 1)}
                aria-label={t("general.compositionNext")}><CaretRightIcon size={24}/></button>
            <button className="compositionFullscreenApply" type="button" onClick={() => {
                applyComposition(item.appearance);
                setCompositions(previous => ({ ...previous, activeId: item.id, lastCycleKey: compositionCycleKey(previous.mode, new Date()) }));
                close();
            }}>{t("general.compositionApply")}</button>
        </div>
    </div>;
}
