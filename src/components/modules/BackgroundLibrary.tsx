import { useRef, useState, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowsOutIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { Background } from "../ts/utils/background";
import Selector from "../ts/Selector";
import { api } from "../ts/api";
import { ChevronDown, CircleCheck, ImagePlus } from "lucide-react";
import { backgroundGroups, MAX_CUSTOM_BACKGROUNDS } from "../ts/utils/backgroundCatalog";
import { BackgroundHelpButton } from "./BackgroundHelp";
import "./BackgroundLibrary.scss";
import "../../scss/Loading.scss";

function CustomBackgroundThumb({ url }: { url: string }) {
    const [ loaded, setLoaded ] = useState(false);

    return (
        <div className="backgroundLibraryThumb backgroundCustomThumb">
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
    const { bg, bgUrl, setBgUrl, bgGallery, settingsLoaded, refetchSettings, wallpaperStyle } = useSettings();
    const { setNewBg } = useUpSettings();
    const { setBlackout } = useBlackout();
    const [ tab, setTab ] = useState<"stock" | "custom">("custom");
    const sliderRef = useRef<HTMLDivElement>(null);
    const sliderX = useMotionValue("0%");
    const reduceMotion = useReducedMotion();
    const swipeStart = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null);
    const suppressClick = useRef(false);
    const [ saving, setSaving ] = useState(false);
    const [ collapsedGroups, setCollapsedGroups ] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement | null>(null);
    const changeTab = (next: "stock" | "custom") => {
        setTab(next);
        animate(sliderX, next === "stock" ? "-50%" : "0%", {
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
            const beyondEdge = tab === "custom" ? dx > 0 : dx < 0;
            const delta = (beyondEdge ? dx * .2 : dx) / (2 * width) * 100;
            sliderX.set(`${(tab === "stock" ? -50 : 0) + delta}%`);
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
            if (tab === "custom" && dx < 0) {
                changeTab("stock");
                return;
            }
            if (tab === "stock" && dx > 0) {
                changeTab("custom");
                return;
            }
        }
        animate(sliderX, tab === "stock" ? "-50%" : "0%", {
            duration: reduceMotion ? 0 : .25,
            ease: [.22, 1, .36, 1]
        });
    };

    const handleSlidePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
        swipeStart.current = null;
        animate(sliderX, tab === "stock" ? "-50%" : "0%", {
            duration: reduceMotion ? 0 : .2
        });
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const tabs = [
        { value: "custom" as const, label: `${t("backgroundLibrary.custom")} (${bgGallery.length}/${MAX_CUSTOM_BACKGROUNDS})`, func: changeTab },
        { value: "stock" as const, label: t("backgroundLibrary.stock"), func: changeTab }
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
        items: group.items.map(item => ({ id: item.id, label: t(item.id === "color" && wallpaperStyle.fillMode === "gradient" ? "backgroundLibrary.gradientBackground" : item.labelKey) }))
    }));

    const selectStock = (id: string) => {
        if (saving) return;
        setNewBg(id);
    };


    return (
        <div className="backgroundLibraryModal" role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.title")}>
            <div className="backgroundLibraryHeader">
                <div className="backgroundLibraryTitle">{t("backgroundLibrary.title")}</div>
                <BackgroundHelpButton/>
            </div>
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
                    <div className="backgroundLibrarySlide" style={{ order: 1 }}>
                        <div className="backgroundLibraryScroll">
                            {!settingsLoaded ? (
                                <div className="backgroundLibraryGrid" role="status" aria-busy="true">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <div className="backgroundLibrarySkeleton" key={i}>
                                            <div className="skeletonBlock"/>
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
                                                    <div key={item.id} className="backgroundLibraryTile">
                                                        <button type="button"
                                                            className={"backgroundLibraryChoose" + (bg === item.id ? " selected" : "")}
                                                            aria-pressed={bg === item.id}
                                                            aria-label={t("backgroundLibrary.chooseWallpaper", { name: item.label })}
                                                            title={item.label}
                                                            onClick={() => selectStock(item.id)}>
                                                            <div className="backgroundLibraryThumb">
                                                                <Background previewBg={item.id}/>
                                                            </div>
                                                            {bg === item.id && <span className="backgroundLibraryCheck" aria-label={t("backgroundLibrary.selected")}>
                                                                <CircleCheck size={21}/>
                                                            </span>}
                                                        </button>
                                                        <button type="button" className="backgroundLibraryPreview"
                                                            aria-label={t("backgroundLibrary.preview") + ": " + item.label}
                                                            title={t("backgroundLibrary.preview")}
                                                            onClick={() => previewBackground(item.id)}>
                                                            <ArrowsOutIcon size={17}/>
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
                    <div className="backgroundLibrarySlide" style={{ order: 0 }}>
                        <div className="backgroundLibraryScroll">
                            <input ref={fileRef} type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden
                                onChange={event => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    if (file && bgGallery.length < MAX_CUSTOM_BACKGROUNDS) setBlackout({ seted: true, module: "BgHandler", bg: file });
                                }}/>
                            {!settingsLoaded ? (
                                <div className="backgroundLibraryGrid" role="status" aria-busy="true">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <div className="backgroundLibrarySkeleton" key={i}>
                                            <div className="skeletonBlock"/>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="backgroundLibraryGrid">
                                    {bgGallery.map(item => (
                                        <div key={item.url} className="backgroundLibraryTile">
                                            <button type="button"
                                                className={"backgroundLibraryChoose" + (bg === "custom" && bgUrl === item.url ? " selected" : "")}
                                                aria-pressed={bg === "custom" && bgUrl === item.url}
                                                disabled={saving}
                                                aria-label={t("backgroundLibrary.chooseWallpaper", { name: t("backgroundLibrary.customWallpaper") })}
                                                title={t("backgroundLibrary.customWallpaper")}
                                                onClick={() => selectCustom(item.url)}>
                                                <CustomBackgroundThumb url={item.url}/>
                                                {bg === "custom" && bgUrl === item.url && <span className="backgroundLibraryCheck" aria-label={t("backgroundLibrary.selected")}>
                                                    <CircleCheck size={21}/>
                                                </span>}
                                            </button>
                                            <button type="button" className="backgroundLibraryDelete"
                                                disabled={saving} aria-label={t("backgroundLibrary.delete")}
                                                title={t("backgroundLibrary.delete")}
                                                onClick={() => deleteCustom(item.url)}>
                                                <TrashIcon size={18}/>
                                            </button>
                                            <button type="button" className="backgroundLibraryPreview"
                                                disabled={saving} aria-label={t("backgroundLibrary.preview")}
                                                title={t("backgroundLibrary.preview")}
                                                onClick={() => previewBackground("custom", item.url)}>
                                                <ArrowsOutIcon size={17}/>
                                            </button>
                                        </div>
                                    ))}
                                    {bgGallery.length < MAX_CUSTOM_BACKGROUNDS && <button type="button" className="backgroundLibraryAdd"
                                        aria-label={t("backgroundLibrary.add")} title={t("backgroundLibrary.add")}
                                        onClick={() => fileRef.current?.click()}>
                                        <ImagePlus size={23}/>
                                    </button>}
                                </div>
                            )}
                            {settingsLoaded && bgGallery.length >= MAX_CUSTOM_BACKGROUNDS &&
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
