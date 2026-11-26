import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { CaretLeftIcon, CaretRightIcon, XIcon, GearIcon, CalendarBlankIcon, NewspaperIcon, BookmarkSimpleIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import useModalSlider from "../hooks/utils/useModalSlider";
import { compositionCycleKey, type CompositionAppearance } from "../ts/utils/compositions";
import { Background } from "../ts/utils/background";
import { validHex, getCustomHighlightHex } from "../ts/utils/customPalette";
import "./scss/CompositionFullscreen.scss";

function themeProps(appearance: CompositionAppearance, systemDark: boolean) {
    const theme = appearance.theme === "system" ? systemDark ? "dark" : "light" : appearance.theme;
    const style: Record<string, string> = { "--blur": appearance.blur + "px" };
    const accent = appearance.customAccentHex;
    const grad = appearance.customGradHex;
    if (appearance.accent === "custom" && validHex(accent)) {
        style["--accent"] = accent;
        style["--accent_text"] = accent;
        style["--accent_highlight"] = getCustomHighlightHex(accent, theme === "light" ? "light" : "dark");
        const [r, g, b] = [1, 3, 5].map(i => parseInt(accent.slice(i, i + 2), 16));
        style["--inner_text"] = .2126 * r + .7152 * g + .0722 * b > 168 ? "#111111" : "#ffffff";
    }
    if (appearance.grad === "custom" && validHex(grad)) style["--grad"] = grad;
    return { "data-theme": theme, "data-accent": appearance.accent, "data-grad": appearance.grad,
        "data-decor": appearance.decor, style: style as CSSProperties };
}

export default function CompositionFullscreen() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { compositions, applyComposition, setCompositions } = useSettings();
    const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
    useEffect(() => {
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        const change = () => setSystemDark(query.matches);
        query.addEventListener("change", change);
        return () => query.removeEventListener("change", change);
    }, []);
    const items = compositions.items;
    const [index, setIndex] = useState(() => Math.max(0, items.findIndex(item => item.id === blackout.options?.id)));
    const activeIndex = Math.min(index, Math.max(0, items.length - 1));
    const slider = useModalSlider(activeIndex, items.length, "compositions", setIndex);
    const item = items[activeIndex];
    const close = () => setBlackout({ seted: false });
    if (!item) return null;

    return <div className="compositionFullscreen" {...themeProps(item.appearance, systemDark)} role="dialog" aria-label={t("general.compositionPreview")}>
        <button className="compositionFullscreenClose" type="button" onClick={close} aria-label={t("backgroundLibrary.exitPreview")}>
            <XIcon size={24}/>
        </button>
        <div className="compositionFullscreenViewport" ref={slider.viewportRef}>
            <div className="compositionFullscreenTrack" style={{
                transform: `translateX(${-(slider.previewIndex ?? activeIndex) * 100}%)`,
                transition: slider.previewIndex === null ? undefined : "none"
            }}>
                {items.map(({ id, appearance }, position) => (
                    <div className="compositionFullscreenSlide" key={id} inert={position !== activeIndex}
                        data-layout={appearance.layout} {...themeProps(appearance, systemDark)}>
                        <Background previewBg={appearance.bg} previewUrl={appearance.bgUrl}
                            previewEffects={appearance.bgEffects} previewWallpaperStyle={appearance.wallpaperStyle}
                            previewContourPattern={appearance.contourPattern} previewContourSize={appearance.contourSize}
                            previewArtPattern={appearance.artPattern} previewArtSize={appearance.artSize}/>
                        <div className="compositionSample" aria-hidden="true">
                            <aside className="compositionSampleSide">
                                <div><NewspaperIcon/>{t("accountNavigation.feed", { ns: "common" })}</div>
                                <div><CalendarBlankIcon/>{t("accountNavigation.activities", { ns: "common" })}</div>
                                <div className="compositionSampleSelected"><GearIcon/>{t("settings.title")}</div>
                                <div><BookmarkSimpleIcon/>{t("accountNavigation.saved", { ns: "common" })}</div>
                            </aside>
                            <header className="compositionSampleTitle">{t("settings.personalization")}</header>
                            <div className="compositionSampleSections">
                                <section>
                                    <span>{t("personalization.theme")}</span>
                                    <div className="compositionSampleOptions">
                                        <span className="compositionSampleSelected">{t("personalization." + (appearance.theme === "system" ? systemDark ? "dark" : "light" : appearance.theme))}</span>
                                    </div>
                                </section>
                                <section>
                                    <span>{t("backgroundLibrary.blurBackground")}</span>
                                    <div className="compositionSampleLevel">
                                        <span style={{ width: `${Math.max(0, Math.min(100, appearance.bgEffects.blur / 30 * 100))}%` }}/>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                ))}
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
