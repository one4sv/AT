import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { CaretLeftIcon, CaretRightIcon, XIcon, MoonStarsIcon, SunIcon } from "@phosphor-icons/react";
import { MirrorRectangular, PaintBucket } from "lucide-react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { MAX_CUSTOM_BACKGROUNDS } from "../ts/utils/backgroundCatalog";
import { privateAssetUrl } from "../ts/utils/privateAssetUrl";
import useModalSlider from "../hooks/utils/useModalSlider";
import { compositionCycleKey, type CompositionAppearance } from "../ts/utils/compositions";
import { Background } from "../ts/utils/background";
import { validHex, getCustomHighlightHex } from "../ts/utils/customPalette";
import Selector from "../ts/Selector";
import Toggler from "../ts/Toggler";
import SeekBar from "../../pages/Settings/components/SeekBar";
import "../../pages/Settings/scss/seekbar.scss";
import "../../pages/Settings/scss/pers.scss";
import "../../scss/header.scss";
import "./scss/CompositionFullscreen.scss";

function resolveTheme(appearance: CompositionAppearance, systemDark: boolean) {
    return appearance.theme === "system" ? systemDark ? "dark" : "light" : appearance.theme;
}

function themeProps(appearance: CompositionAppearance, systemDark: boolean) {
    const theme = resolveTheme(appearance, systemDark);
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

const keepPreviewValue = () => {};
const filters = ["none", "grayscale", "sepia", "invert", "contrast", "saturate"] as const;
export default function CompositionFullscreen() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { compositions, applyComposition, setCompositions, bgGallery, settingsLoaded, refetchSettings } = useSettings();
    const { showNotification } = useNote();
    const [saving, setSaving] = useState(false);
    const [sharedPreviewUrl, setSharedPreviewUrl] = useState("");
    const shared = blackout.sharedComposition;
    const sharedFile = shared ? blackout.bg : undefined;
    useEffect(() => {
        if (!sharedFile) { setSharedPreviewUrl(""); return; }
        const url = URL.createObjectURL(sharedFile);
        setSharedPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [sharedFile]);
    const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
    useEffect(() => {
        const query = window.matchMedia("(prefers-color-scheme: dark)");
        const change = () => setSystemDark(query.matches);
        query.addEventListener("change", change);
        return () => query.removeEventListener("change", change);
    }, []);
    const items = shared ? [{ ...shared, appearance: { ...shared.appearance, bgUrl: sharedPreviewUrl } }] : compositions.items;
    const [index, setIndex] = useState(() => Math.max(0, items.findIndex(item => item.id === blackout.options?.id)));
    const activeIndex = Math.min(index, Math.max(0, items.length - 1));
    const slider = useModalSlider(activeIndex, items.length, "compositions", setIndex);
    const item = items[activeIndex];
    const close = () => { if (!saving) setBlackout({ seted: false }); };
    if (!item) return null;
    const apply = async () => {
        if (saving) return;
        let appearance = item.appearance;
        if (shared && appearance.bg === "custom") {
            if (!settingsLoaded || bgGallery.length >= MAX_CUSTOM_BACKGROUNDS) {
                showNotification("error", t("backgroundLibrary.shareFull", { count: MAX_CUSTOM_BACKGROUNDS }));
                return;
            }
            if (!sharedFile) { showNotification("error", t("backgroundLibrary.shareNotFound")); return; }
            setSaving(true);
            try {
                const data = new FormData();
                data.append("bg", sharedFile);
                const result = await api.post("uploadbg", data);
                if (!result.data?.success || typeof result.data.bg_url !== "string") throw new Error("Wallpaper upload failed");
                const url = privateAssetUrl(result.data.bg_url);
                if (!url.startsWith("/api/private-asset/bgs/")) throw new Error("Invalid saved wallpaper");
                appearance = { ...appearance, bgUrl: url };
                await refetchSettings();
            } catch {
                showNotification("error", t("backgroundLibrary.shareUnavailable"));
                return;
            } finally { setSaving(false); }
        }
        applyComposition(appearance);
        setCompositions(previous => ({ ...previous, activeId: shared ? null : item.id, lastCycleKey: compositionCycleKey(previous.mode, new Date()) }));
        setBlackout({ seted: false });
    };

    return <div className="compositionFullscreen" {...themeProps(item.appearance, systemDark)} role="dialog" aria-label={t("general.compositionPreview")}>
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
                        <div className="compositionSample">
                            <header className="headerDiv compositionSampleHeader">
                                <div className="header headerTitle"><span className="headerCustomText">{t("settings.personalization")}</span></div>
                                <button className="headerButt" type="button" onClick={close}
                                    aria-label={t("backgroundLibrary.exitPreview")}><XIcon/></button>
                            </header>
                            <div className="compositionSampleSections">
                                <section>
                                    <span>{t("personalization.theme")}</span>
                                    <div inert><Selector selected={resolveTheme(appearance, systemDark)} arr={[
                                        { label: t("personalization.dark"), value: "dark", icon: MoonStarsIcon, func: keepPreviewValue },
                                        { label: t("personalization.light"), value: "light", icon: SunIcon, func: keepPreviewValue }
                                    ]}/></div>
                                </section>
                                <section>
                                    <span>{t("personalization.decor")}</span>
                                    <div inert><Selector selected={appearance.decor} arr={[
                                        { label: t("personalization.default"), value: "default", icon: PaintBucket, func: keepPreviewValue },
                                        { label: t("personalization.glass"), value: "glass", icon: MirrorRectangular, func: keepPreviewValue }
                                    ]}/></div>
                                    <div className="compositionSampleValue">
                                        <span>{t("personalization.decorBlur")}</span>
                                        <span>{appearance.blur} px</span>
                                    </div>
                                    <div inert><SeekBar id="compositionPreviewDecorBlur" min={2} max={36}
                                        value={appearance.blur} unit="px" disabled={appearance.decor !== "glass"}/></div>
                                </section>
                                <section>
                                    <div className="compositionSampleValue">
                                        <span>{t("backgroundLibrary.blurBackground")}</span>
                                        <span>{appearance.bgEffects.blur} px</span>
                                    </div>
                                    <div inert><SeekBar id="compositionPreviewBackgroundBlur" min={0} max={30}
                                        value={appearance.bgEffects.blur} unit="px" disabled={false}/></div>
                                    <span>{t("backgroundLibrary.filters")}</span>
                                    <div className="backgroundEffectsFilters" inert>
                                        {filters.map(filter => (
                                            <button key={filter} type="button" data-filter={filter}
                                                className={(appearance.bgEffects.filter ?? "none") === filter ? "active" : ""}>
                                                {t(`backgroundLibrary.${filter}`)}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                <section className="compositionSampleDesktopOnly">
                                    <div className="compositionSampleValue">
                                        <span>{t("personalization.sideMenu")}</span>
                                        <span className="compositionSampleMenuMode">
                                            {t(appearance.layout === "always" ? "personalization.sideMenuAlways" : "personalization.sideMenuButton")}
                                            <span inert><Toggler state={appearance.layout === "always"}/></span>
                                        </span>
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
            <button className="compositionFullscreenApply" type="button" disabled={saving || (Boolean(sharedFile) && !sharedPreviewUrl)} onClick={() => void apply()}>{t(saving ? "backgroundLibrary.uploadSaving" : "general.compositionApply")}</button>
        </div>
    </div>;
}
