import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { CaretLeftIcon, CaretRightIcon, XIcon, GearIcon, SneakerMoveIcon, NewspaperIcon, BookmarkSimpleIcon, MoonStarsIcon, SunIcon, TextIndentIcon, UserIcon } from "@phosphor-icons/react";
import { MirrorRectangular, PaintBucket } from "lucide-react";
import { useUser } from "../hooks/UserHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import useModalSlider from "../hooks/utils/useModalSlider";
import { compositionCycleKey, type CompositionAppearance } from "../ts/utils/compositions";
import { Background } from "../ts/utils/background";
import { validHex, getCustomHighlightHex } from "../ts/utils/customPalette";
import Selector from "../ts/Selector";
import SeekBar from "../../pages/Settings/components/SeekBar";
import "../../pages/Settings/scss/seekbar.scss";
import "../../pages/Settings/scss/pers.scss";
import "../../scss/header.scss";
import "../../scss/SM/smAccount.scss";
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
const navigation = [
    ["accountNavigation.feed", "accountNavigation.feedDesc", NewspaperIcon],
    ["sideMenu.plansAndActivities", "accountNavigation.activitiesDesc", SneakerMoveIcon],
    ["accountNavigation.settings", "accountNavigation.settingsDesc", GearIcon],
    ["accountNavigation.saved", "accountNavigation.savedDesc", BookmarkSimpleIcon]
] as const;

export default function CompositionFullscreen() {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const [menuSlide, setMenuSlide] = useState<string | null>(null);
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
    const selectSlide = (next: number) => {
        setIndex(next);
        setMenuSlide(null);
    };
    const slider = useModalSlider(activeIndex, items.length, "compositions", selectSlide);
    const item = items[activeIndex];
    const close = () => setBlackout({ seted: false });
    if (!item) return null;

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
                        <div className="compositionSample" data-menu-open={menuSlide === id}>
                            <aside className="compositionSampleSide" inert>
                                <div className="SMaccount">
                                    <div className="SMAvatar">
                                        {user.avatar_url ? <img src={user.avatar_url} alt=""/> : <UserIcon weight="fill"/>}
                                    </div>
                                    <div className="SMaccDesc">
                                        <span className="settingUserName">{user.username || user.nick}</span>
                                    </div>
                                </div>
                                <div className="SMaccountButtsWrapper">
                                    {navigation.map(([title, description, Icon]) => (
                                        <div key={title} className={`SMmainButt ${Icon === GearIcon ? "active" : ""}`}>
                                            <span className="SMmainButtName">
                                                <Icon weight="fill" size={30} className="SMmainButtSvg"/>
                                                {t(title, { ns: "common" })}<CaretRightIcon className="fastButtCaret"/>
                                            </span>
                                            <div className="SMmainButtDesc">{t(description, { ns: "common" })}</div>
                                        </div>
                                    ))}
                                </div>
                            </aside>
                            <header className="headerDiv compositionSampleHeader">
                                <button className="headerButt compositionSampleMenuButton" type="button"
                                    aria-label={t("personalization.sideMenu")} aria-expanded={menuSlide === id}
                                    onClick={() => setMenuSlide(menuSlide === id ? null : id)}><TextIndentIcon/></button>
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
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="compositionFullscreenControls">
            <button type="button" disabled={activeIndex === 0} onClick={() => selectSlide(activeIndex - 1)}
                aria-label={t("general.compositionPrevious")}><CaretLeftIcon size={24}/></button>
            <div><span>{item.name}</span><span>{activeIndex + 1} / {items.length}</span></div>
            <button type="button" disabled={activeIndex === items.length - 1} onClick={() => selectSlide(activeIndex + 1)}
                aria-label={t("general.compositionNext")}><CaretRightIcon size={24}/></button>
            <button className="compositionFullscreenApply" type="button" onClick={() => {
                applyComposition(item.appearance);
                setCompositions(previous => ({ ...previous, activeId: item.id, lastCycleKey: compositionCycleKey(previous.mode, new Date()) }));
                close();
            }}>{t("general.compositionApply")}</button>
        </div>
    </div>;
}
