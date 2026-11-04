import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowsOutIcon, CheckCircleIcon, PlusCircleIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import BackIconsScene from "../ts/utils/BackIconsScene";
import { getBackgroundFilter } from "../ts/utils/backgroundFilter";
import Selector from "../ts/Selector";
import { BackgroundScene, type StockScene, isStockScene, supportsBackgroundMotion } from "../ts/utils/BackgroundScene";
import { api } from "../ts/api";
import { ChevronDown, Film, LayoutGrid, Palette, WandSparkles } from "lucide-react";
import { backgroundGroups } from "../ts/utils/backgroundCatalog";
import "./BackgroundLibrary.scss";
import "../../scss/Loading.scss";

function CustomBackgroundThumb({ url }: { url: string }) {
    const [ loaded, setLoaded ] = useState(false);

    return (
        <div className="bgMini bgImg backgroundCustomThumb">
            {!loaded && <div className="skeletonBlock" aria-hidden="true"/>}
            <img src={url} alt="" loading="lazy"
                className={loaded ? "loaded" : ""}
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}/>
        </div>
    );
}

export default function BackgroundLibrary() {
    const { t } = useTranslation("settings");
    const { bg, bgUrl, setBgUrl, bgGallery, bgEffects, contourPattern, contourSize, artPattern, artSize, settingsLoaded, refetchSettings } = useSettings();
    const { setNewBg } = useUpSettings();
    const { setBlackout } = useBlackout();
    const [ tab, setTab ] = useState<"stock" | "custom">("stock");
    const sliderRef = useRef<HTMLDivElement>(null);
    const sliderX = useMotionValue("0%");
    const reduceMotion = useReducedMotion();
    const swipeStart = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null);
    const suppressClick = useRef(false);
    const [ saving, setSaving ] = useState(false);
    const [ collapsedGroups, setCollapsedGroups ] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const previewStyle = { filter: getBackgroundFilter(bgEffects, .24) };
    const changeTab = (next: "stock" | "custom") => {
        setTab(next);
        animate(sliderX, next === "custom" ? "-50%" : "0%", {
            duration: reduceMotion ? 0 : .3,
            ease: [.22, 1, .36, 1]
        });
    };

    const handleSlidePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        suppressClick.current = false;
        swipeStart.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            horizontal: false
        };
    };

    const handleSlidePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const start = swipeStart.current;
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;

        if (!start.horizontal && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            if (Math.abs(dy) >= Math.abs(dx)) {
                swipeStart.current = null;
                return;
            }
            start.horizontal = true;
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        if (start.horizontal) {
            const width = sliderRef.current?.clientWidth ?? 1;
            const beyondEdge = tab === "stock" ? dx > 0 : dx < 0;
            const delta = (beyondEdge ? dx * .2 : dx) / (2 * width) * 100;
            sliderX.set(`${(tab === "custom" ? -50 : 0) + delta}%`);
        }
    };

    const handleSlidePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        const start = swipeStart.current;
        if (!start || start.id !== event.pointerId) return;
        swipeStart.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        const dx = event.clientX - start.x;
        if (start.horizontal && Math.abs(dx) > 45) {
            if (tab === "stock" && dx < 0) {
                changeTab("custom");
                return;
            }
            if (tab === "custom" && dx > 0) {
                changeTab("stock");
                return;
            }
        }
        animate(sliderX, tab === "custom" ? "-50%" : "0%", {
            duration: reduceMotion ? 0 : .25,
            ease: [.22, 1, .36, 1]
        });
    };

    const handleSlidePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
        swipeStart.current = null;
        animate(sliderX, tab === "custom" ? "-50%" : "0%", {
            duration: reduceMotion ? 0 : .2
        });
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const tabs = [
        { value: "stock" as const, label: t("backgroundLibrary.stock"), func: changeTab },
        { value: "custom" as const, label: `${t("backgroundLibrary.custom")} (${bgGallery.length}/6)`, func: changeTab }
    ];

    const selectCustom = (url: string) => {
        if (saving) return;
        // Only the current browser saves which gallery image is selected.
        setBgUrl(url);
        setNewBg("custom");
    };

    const previewBackground = (id: string, url?: string) => {
        if (saving) return;
        setBlackout({ seted: true, module: "BackgroundFullscreen", options: { id, url } });
    };

    const deleteCustom = (url: string) => {
        if (saving) return;
        setBlackout({ seted: true, module: "ConfirmAction", confirmAction: {
            title: t("backgroundLibrary.deleteQuestion"),
            description: t("backgroundLibrary.deleteHint"),
            label: t("backgroundLibrary.delete"),
            run: async () => {
                setSaving(true);
                try {
                    const res = await api.post("backgrounds/delete", { url });
                    if (!res.data?.success) throw new Error();
                    if (bg === "custom" && bgUrl === url) {
                        setBgUrl("");
                        setNewBg("landing");
                    }
                    await refetchSettings();
                } finally {
                    setSaving(false);
                }
            }
        } });
    };

    const stockGroups = backgroundGroups.map(group => ({
        id: group.id,
        items: group.items.map(item => ({ id: item.id, label: t(item.labelKey) }))
    }));

    const selectStock = (id: string) => {
        if (saving) return;
        setNewBg(id);
    };


    return (
        <div className="backgroundLibraryModal" role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.title")}>
            <div className="backgroundLibraryTitle">{t("backgroundLibrary.title")}</div>
            <Selector arr={tabs} selected={tab}/>
            <div className="backgroundLibrarySlidesViewport" ref={sliderRef}
                onPointerDown={handleSlidePointerDown}
                onPointerMove={handleSlidePointerMove}
                onPointerUp={handleSlidePointerUp}
                onPointerCancel={handleSlidePointerCancel}
                onClickCapture={event => {
                    if (!suppressClick.current) return;
                    event.preventDefault();
                    event.stopPropagation();
                    suppressClick.current = false;
                }}>
                <motion.div className="backgroundLibrarySlidesTrack" style={{ x: sliderX }}>
                    <div className="backgroundLibrarySlide">
                        <div className="backgroundLibraryScroll">
                            {!settingsLoaded ? (
                                <div className="backgroundLibraryGrid" role="status" aria-busy="true">
                                    {Array.from({ length: 3 }, (_, i) => (
                                        <div className="backgroundLibrarySkeleton" key={i}>
                                            <div className="skeletonBlock"/>
                                            <div className="skeletonLine skeletonShort"/>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="backgroundLibrarySections">
                                    {stockGroups.map(group => (
                                        <section className="backgroundLibrarySection" key={group.id}>
                                            <button type="button" className="backgroundLibrarySectionTitle"
                                                aria-expanded={!collapsedGroups.includes(group.id)}
                                                onClick={() => setCollapsedGroups(current => current.includes(group.id)
                                                    ? current.filter(id => id !== group.id) : [...current, group.id])}>
                                                <span>{t(`backgroundLibrary.${group.id}`)}</span>
                                                <ChevronDown size={20} className={collapsedGroups.includes(group.id) ? "collapsed" : ""}/>
                                            </button>
                                            <div className="backgroundLibraryGrid" hidden={collapsedGroups.includes(group.id)}>
                                                {group.items.map(item => (
                                                    <div key={item.id}
                                                        className={`bgPick backgroundLibraryTile ${bg === item.id ? "active" : ""}`}>
                                                        <button type="button" className="backgroundLibraryChoose"
                                                            onClick={() => selectStock(item.id)}>
                                                            {item.id === "landing" ?
                                                            <div className="bgImg bgMini landingBackground" style={previewStyle}/> :
                                                            item.id === "default" ?
                                                                <div className="bgImg bgMini" style={previewStyle}><BackIconsScene pattern={contourPattern} size={contourSize}/></div> :
                                                                isStockScene(item.id) ?
                                                                    <div className="bgImg bgMini" style={{ ...previewStyle, "--scene-duration": `${18 / Math.max(.25, Math.min(3, bgEffects.speed ?? 1))}s` } as CSSProperties}>
                                                                        <BackgroundScene variant={item.id as StockScene} motion={supportsBackgroundMotion(item.id) && bgEffects.movement && (bgEffects.speed ?? 1) > 0}
                                                                            artPattern={artPattern} artSize={artSize}/>
                                                                    </div> :
                                                                    <div className="bgImg bgMini" style={previewStyle}/>}
                                                            <span className={`backgroundLibraryName ${bg === item.id ? "bgSpanChoosen" : ""}`}>
                                                                {item.label}
                                                                {supportsBackgroundMotion(item.id) && <span className="backgroundLibraryCapability" title={t("backgroundLibrary.motionAvailable")}>
                                                                    <Film size={15} aria-label={t("backgroundLibrary.motionAvailable")}/>
                                                                </span>}
                                                                <span className="backgroundLibraryCapability" title={t("backgroundLibrary.themeAware")}>
                                                                    <Palette size={15} aria-label={t("backgroundLibrary.themeAware")}/>
                                                                </span>
                                                                {item.id === "art" && <span className="backgroundLibraryCapability" title={t("backgroundLibrary.appearanceAware")}>
                                                                    <WandSparkles size={15} aria-label={t("backgroundLibrary.appearanceAware")}/>
                                                                </span>}
                                                                {(item.id === "default" || item.id === "art") &&
                                                                    <span className="backgroundLibraryCapability" title={t("backgroundLibrary.patternAvailable")}>
                                                                        <LayoutGrid size={15} aria-label={t("backgroundLibrary.patternAvailable")}/>
                                                                    </span>}
                                                            </span>
                                                            {bg === item.id && <CheckCircleIcon className="backgroundLibraryCheck" size={20} weight="fill"/>}
                                                        </button>
                                                        <button type="button" className="backgroundLibraryPreview"
                                                            aria-label={t("backgroundLibrary.preview")} title={t("backgroundLibrary.preview")}
                                                            onClick={() => previewBackground(item.id)}>
                                                            <ArrowsOutIcon size={20}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="backgroundLibrarySlide">
                        <div className="backgroundLibraryScroll">
                            {bgGallery.length < 6 && settingsLoaded && (
                                <button type="button" className="backgroundLibraryAdd" onClick={() => fileRef.current?.click()}>
                                    <PlusCircleIcon size={24} weight="fill"/>
                                    {t("backgroundLibrary.add")}
                                </button>
                            )}
                            <input ref={fileRef} type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden
                                onChange={event => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    if (file) setBlackout({ seted: true, module: "BgHandler", bg: file });
                                }}/>
                            {!settingsLoaded ? (
                                <div className="backgroundLibraryGrid" role="status" aria-busy="true">
                                    {Array.from({ length: 2 }, (_, i) => (
                                        <div className="backgroundLibrarySkeleton" key={i}>
                                            <div className="skeletonBlock"/>
                                            <div className="skeletonLine skeletonShort"/>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="backgroundLibraryGrid">
                                    {bgGallery.map(item => (
                                        <div key={item.url} className={`bgPick backgroundLibraryTile ${bg === "custom" && bgUrl === item.url ? "active" : ""}`}>
                                            <button type="button" className="backgroundLibraryChoose" disabled={saving}
                                                onClick={() => void selectCustom(item.url)}>
                                                <CustomBackgroundThumb url={item.url}/>
                                                 {bg === "custom" && bgUrl === item.url && <CheckCircleIcon className="backgroundLibraryCheck" size={20} weight="fill"/>}
                                            </button>
                                            <button type="button" className="backgroundLibraryDelete"
                                                disabled={saving} aria-label={t("backgroundLibrary.delete")}
                                                onClick={() => deleteCustom(item.url)}>
                                                <TrashIcon size={19}/>
                                            </button>
                                            <button type="button" className="backgroundLibraryPreview"
                                                disabled={saving} aria-label={t("backgroundLibrary.preview")}
                                                title={t("backgroundLibrary.preview")}
                                                onClick={() => previewBackground("custom", item.url)}>
                                                <ArrowsOutIcon size={20}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {settingsLoaded && bgGallery.length >= 6 &&
                                <div className="settingHint">{t("backgroundLibrary.limit")}</div>}
                            {settingsLoaded && !bgGallery.length &&
                                <div className="settingHint">{t("backgroundLibrary.empty")}</div>}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
