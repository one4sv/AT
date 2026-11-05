import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Check, CircleCheck, CircleHelp, ImagePlus, RotateCcw, Trash2, Film, Palette, LayoutGrid, WandSparkles, Settings2, Images } from "lucide-react";
import { useSettings } from "../../components/hooks/SettingsHook";
import { useUpSettings } from "../../components/hooks/UpdateSettingsHook";
import Header from "../../components/ts/Header";
import PageBottom from "../../components/ts/PageBottom";
import useCompactLayout from "../../components/hooks/utils/useCompactLayout";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { useNote } from "../../components/hooks/NoteHook";
import { api } from "../../components/ts/api";
import type { BackgroundEffects } from "../../components/context/SettingsContext";
import { Background } from "../../components/ts/utils/background";
import { backgroundGroups } from "../../components/ts/utils/backgroundCatalog";
import { supportsBackgroundMotion, isPhotographicScene } from "../../components/ts/utils/BackgroundScene";
import { ContourPatternPicker } from "../Settings/components/SettingsTabs/ContourPatternPicker";
import SeekBar from "../Settings/components/SeekBar";
import Toggler from "../../components/ts/Toggler";
import "./WallpaperStudio.scss";

type WallpaperItem = { id: string; url?: string; label: string; group: string };
type Hold = { pointerId: number; x: number; y: number; index: number; triggered: boolean; moved: boolean };
type PeekDrag = { pointerId: number; x: number; y: number; lastStep: number; moved: boolean; direction: "none" | "horizontal" | "vertical" };

export default function WallpaperStudio() {
    const { tab } = useParams<{ tab?: string }>();
    const settingsPage = tab === "settings";
    const navigate = useNavigate();
    const { t } = useTranslation("settings");
    const { bg, bgUrl, bgGallery, bgEffects, setBgEffects, contourPattern, setContourPattern, contourSize, setContourSize, artPattern, setArtPattern, artSize, setArtSize, setBgUrl, refetchSettings } = useSettings();
    const { setNewBg } = useUpSettings();
    const isMobile = useCompactLayout();
    const { blackout, setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const reduceMotion = useReducedMotion();
    const [ open, setOpen ] = useState(true);
    const [ preview, setPreview ] = useState(0);
    const [ direction, setDirection ] = useState(1);
    const [ collapsedGroups, setCollapsedGroups ] = useState<string[]>([]);
    const [ busy, setBusy ] = useState(false);
    const [ holding, setHolding ] = useState(false);
    const [ sheetDrag, setSheetDrag ] = useState(0);
    const hold = useRef<Hold | null>(null);
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const peekDrag = useRef<PeekDrag | null>(null);
    const suppressClick = useRef(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialized = useRef(false);
    const wheelGesture = useRef({ total: 0, last: 0 });
    const previewSwipe = useRef<{ x: number; y: number } | null>(null);

    const items = useMemo<WallpaperItem[]>(() => [
        ...backgroundGroups.flatMap(group => group.items.map(item => ({
            id: item.id, label: t(item.labelKey), group: group.id
        }))),
        ...bgGallery.map(item => ({ id: "custom", url: item.url, label: t("backgroundLibrary.custom"), group: "custom" }))
    ], [bgGallery, t]);

    useEffect(() => {
        if (initialized.current || !items.length) return;
        initialized.current = true;
        const index = items.findIndex(item => item.id === bg && (bg !== "custom" || item.url === bgUrl));
        setPreview(Math.max(index, 0));
    }, [bg, bgUrl, items]);

    const currentIndex = Math.min(preview, Math.max(items.length - 1, 0));
    const current = items[currentIndex];
    const isApplied = current && current.id === bg && (bg !== "custom" || current.url === bgUrl);
    const motionAvailable = supportsBackgroundMotion(current?.id ?? "");

    const view = useCallback((index: number) => {
        if (!items.length) return;
        const next = (index + items.length) % items.length;
        setDirection(next >= currentIndex ? 1 : -1);
        setPreview(next);
    }, [items.length, currentIndex]);

    const change = useCallback((step: number) => {
        if (!items.length) return;
        setDirection(step > 0 ? 1 : -1);
        setPreview(index => (index + step + items.length) % items.length);
    }, [items.length]);

    const apply = (index: number) => {
        const item = items[index];
        if (!item || busy) return;
        setDirection(index >= currentIndex ? 1 : -1);
        setPreview(index);
        if (item.id === "custom") {
            setBgUrl(item.url ?? "");
            setNewBg("custom");
        } else {
            setNewBg(item.id);
        }
    };

    const stopHold = () => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        holdTimer.current = null;
    };

    const onTileDown = (index: number, event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        stopHold();
        suppressClick.current = false;
        hold.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, index, triggered: false, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        holdTimer.current = setTimeout(() => {
            if (!hold.current || hold.current.index !== index || hold.current.moved) return;
            hold.current.triggered = true;
            suppressClick.current = true;
            view(index);
            setHolding(true);
            setOpen(false);
        }, 350);
    };

    const onTileMove = (event: PointerEvent<HTMLButtonElement>) => {
        const start = hold.current;
        if (!start || start.pointerId !== event.pointerId) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) {
            start.moved = true;
            stopHold();
        }
    };

    const onTileUp = (event: PointerEvent<HTMLButtonElement>) => {
        if (hold.current?.pointerId !== event.pointerId) return;
        if (hold.current.triggered || hold.current.moved) suppressClick.current = true;
        hold.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        stopHold();
        setHolding(false);
    };

    const selectTile = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
        if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
            return;
        }
        view(index);
    };

    const onPeekDown = (event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        suppressClick.current = false;
        peekDrag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, lastStep: 0, moved: false, direction: "none" };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onPeekMove = (event: PointerEvent<HTMLButtonElement>) => {
        const start = peekDrag.current;
        if (!start || start.pointerId !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (start.direction === "none" && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            start.direction = Math.abs(dy) > Math.abs(dx) ? "vertical" : "horizontal";
        }
        if (start.direction === "vertical") {
            start.moved = true;
            const distance = open ? Math.max(0, dy) : Math.min(0, dy);
            setSheetDrag(Math.max(-window.innerHeight * .75, Math.min(window.innerHeight * .75, distance)));
            return;
        }
        if (start.direction !== "horizontal" || open) return;
        start.moved = true;
        const step = Math.trunc(dx / 55);
        if (step !== start.lastStep) {
            const delta = step - start.lastStep;
            change(-delta);
            start.lastStep = step;
        }
    };

    const onPeekEnd = (event: PointerEvent<HTMLButtonElement>) => {
        const start = peekDrag.current;
        if (!start || start.pointerId !== event.pointerId) return;
        if (start.moved) suppressClick.current = true;
        if (event.type !== "pointercancel" && start.direction === "vertical" &&
            Math.abs(event.clientY - start.y) > 55) setOpen(event.clientY < start.y);
        setSheetDrag(0);
        peekDrag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const handlePreviewWheel = (event: React.WheelEvent<HTMLElement>) => {
        const target = event.target as Element;
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
            target.closest(".wallpaperStudioSheet, .headerDiv, .pageBottom, .wallpaperStudioArrow")) return;
        const now = Date.now();
        if (now - wheelGesture.current.last < 240) return;
        wheelGesture.current.total += event.deltaY;
        if (Math.abs(wheelGesture.current.total) < 40) return;
        setOpen(wheelGesture.current.total > 0);
        wheelGesture.current.last = now;
        wheelGesture.current.total = 0;
    };

    const handlePreviewTouchStart = (event: React.TouchEvent<HTMLElement>) => {
        const target = event.target as Element;
        previewSwipe.current = event.touches.length === 1 &&
            !target.closest(".wallpaperStudioSheet, .headerDiv, .pageBottom, .wallpaperStudioArrow")
            ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    };

    const handlePreviewTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
        const start = previewSwipe.current;
        previewSwipe.current = null;
        if (!start || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dy) > 65 && Math.abs(dy) > Math.abs(dx)) setOpen(dy > 0);
    };

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

    useEffect(() => {
        const finish = () => {
            hold.current = null;
            stopHold();
            setHolding(false);
        };
        document.addEventListener("pointerup", finish);
        document.addEventListener("pointercancel", finish);
        return () => {
            document.removeEventListener("pointerup", finish);
            document.removeEventListener("pointercancel", finish);
            stopHold();
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (blackout.seted) return;
            if ((event.target as Element)?.closest("input,textarea,select,[contenteditable='true']")) return;
            if (event.key === "Escape") {
                if (open) setOpen(false);
                else navigate("/settings/pers");
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                change(event.key === "ArrowRight" ? 1 : -1);
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, navigate, change, blackout.seted]);

    const deleteCustom = (url: string) => {
        if (busy) return;
        setBlackout({ seted: true, module: "ConfirmAction", confirmAction: {
            title: t("backgroundLibrary.deleteQuestion"),
            description: t("backgroundLibrary.deleteHint"),
            label: t("backgroundLibrary.delete"),
            run: async () => {
                setBusy(true);
                try {
                    const result = await api.post("backgrounds/delete", { url });
                    if (!result.data?.success) throw new Error();
                    if (bg === "custom" && bgUrl === url) {
                        setBgUrl("");
                        setNewBg("landing");
                    }
                    await refetchSettings();
                    setPreview(0);
                } finally {
                    setBusy(false);
                }
            }
        } });
    };

    const mini = (item: WallpaperItem, index: number) => (
        <span className="wallpaperStudioMini" key={item.id + (item.url ?? "") + index}>
            <Background previewBg={item.id} previewUrl={item.url}/>
        </span>
    );

    const tile = (item: WallpaperItem, index: number) => (
        <div key={item.id + (item.url ?? "")} className="wallpaperStudioTile">
            <button type="button" className={"wallpaperStudioTileChoose" + (index === currentIndex ? " selected" : "") + (isApplied && index === currentIndex ? " applied" : "")}
                disabled={busy}
                onContextMenu={event => event.preventDefault()}
                onPointerDown={event => onTileDown(index, event)}
                onPointerMove={onTileMove}
                onPointerUp={onTileUp}
                onPointerCancel={onTileUp}
                onClick={event => selectTile(index, event)}
                aria-label={t("backgroundLibrary.chooseWallpaper", { name: item.label })}
                title={item.label}>
                <span className="wallpaperStudioTileImage">
                    <Background previewBg={item.id} previewUrl={item.url}/>
                </span>
                <span className="wallpaperStudioTileLabel">{item.label}</span>
                <span className="wallpaperStudioTileCapabilities">
                    {supportsBackgroundMotion(item.id) && <span className="backgroundLibraryCapability" title={t("backgroundLibrary.motionAvailable")}>
                        <Film size={15} aria-label={t("backgroundLibrary.motionAvailable")}/>
                    </span>}
                    {!isPhotographicScene(item.id) && item.id !== "color" && item.id !== "custom" && <span className="backgroundLibraryCapability" title={t("backgroundLibrary.themeAware")}>
                        <Palette size={15} aria-label={t("backgroundLibrary.themeAware")}/>
                    </span>}
                    {item.id === "art" && <span className="backgroundLibraryCapability" title={t("backgroundLibrary.appearanceAware")}>
                        <WandSparkles size={15} aria-label={t("backgroundLibrary.appearanceAware")}/>
                    </span>}
                    {(item.id === "art" || item.id === "default") && <span className="backgroundLibraryCapability" title={t("backgroundLibrary.patternAvailable")}>
                        <LayoutGrid size={15} aria-label={t("backgroundLibrary.patternAvailable")}/>
                    </span>}
                </span>
                {item.id === bg && (item.id !== "custom" || item.url === bgUrl) && <Check size={18} className="wallpaperStudioApplied"/>}
            </button>
            {item.id === "custom" && <button type="button" className="wallpaperStudioDelete"
                title={t("backgroundLibrary.delete")} aria-label={t("backgroundLibrary.delete")}
                onClick={() => deleteCustom(item.url ?? "")}><Trash2 size={18}/></button>}
        </div>
    );

    if (!current) return null;

    return <main className={"wallpaperStudio" + (open ? " expanded" : " collapsed")}
        onContextMenu={event => event.preventDefault()}
        onWheel={handlePreviewWheel}
        onTouchStart={handlePreviewTouchStart} onTouchEnd={handlePreviewTouchEnd}
        onTouchCancel={() => { previewSwipe.current = null; }}>
        <div className="wallpaperStudioCanvas" aria-hidden="true">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div className="wallpaperStudioFrame" key={current.id + (current.url ?? "")}
                    custom={direction}
                    initial={{ x: reduceMotion ? "0%" : (direction > 0 ? "100%" : "-100%"), opacity: reduceMotion ? 1 : .7 }}
                    animate={{ x: "0%", opacity: 1 }}
                    exit={{ x: reduceMotion ? "0%" : (direction > 0 ? "-100%" : "100%"), opacity: reduceMotion ? 1 : .7 }}
                    transition={{ duration: reduceMotion ? 0 : .32, ease: [.22, 1, .36, 1] }}>
                    <Background previewBg={current.id} previewUrl={current.url}/>
                </motion.div>
            </AnimatePresence>
        </div>

        <Header titleOverride={current.label} hideMenuButton={!isMobile}
            titleSuffix={<span className="wallpaperHeaderCapabilities">
                {supportsBackgroundMotion(current.id) && <span title={t("backgroundLibrary.motionAvailable")}><Film size={16}/></span>}
                {!isPhotographicScene(current.id) && current.id !== "color" && current.id !== "custom" &&
                    <span title={t("backgroundLibrary.themeAware")}><Palette size={16}/></span>}
                {current.id === "art" && <span title={t("backgroundLibrary.appearanceAware")}><WandSparkles size={16}/></span>}
                {(current.id === "art" || current.id === "default") &&
                    <span title={t("backgroundLibrary.patternAvailable")}><LayoutGrid size={16}/></span>}
            </span>}
            rightAction={<button type="button"
                className={`headerButt wallpaperHeaderApply ${isApplied ? "active" : ""}`}
                aria-label={t(isApplied ? "backgroundLibrary.selected" : "backgroundLibrary.apply")}
                aria-pressed={Boolean(isApplied)}
                onClick={() => { if (!isApplied) apply(currentIndex); }}>
                <CircleCheck size={25}/>
            </button>}/>

        <button type="button" className="wallpaperStudioArrow wallpaperStudioArrowLeft"
            aria-label={t("backgroundLibrary.previous")} onClick={() => change(-1)}><ChevronLeft/></button>
        <button type="button" className="wallpaperStudioArrow wallpaperStudioArrowRight"
            aria-label={t("backgroundLibrary.next")} onClick={() => change(1)}><ChevronRight/></button>

        <div className={"wallpaperStudioSheet" + (sheetDrag ? " dragging" : "")}
            style={{ "--studio-drag": sheetDrag + "px" } as CSSProperties}>
            <div className="wallpaperStudioPeek">
                <button className="wallpaperStudioPeekButton" type="button"
                    aria-expanded={open} aria-controls="wallpaperStudioContent"
                    onPointerDown={onPeekDown} onPointerMove={onPeekMove}
                    onPointerUp={onPeekEnd} onPointerCancel={onPeekEnd}
                    onWheel={event => {
                        if (Math.abs(event.deltaY) < 40 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
                        event.preventDefault();
                        setOpen(event.deltaY > 0);
                    }}
                    onClick={event => {
                        if (suppressClick.current) {
                            event.preventDefault();
                            suppressClick.current = false;
                            return;
                        }
                        setOpen(value => !value);
                    }}>
                    {mini(items[(currentIndex - 1 + items.length) % items.length], currentIndex - 1)}
                    {mini(current, currentIndex)}
                    {mini(items[(currentIndex + 1) % items.length], currentIndex + 1)}
                    <span className="wallpaperStudioPeekTitle">
                        {current.label}
                        <small>{t(open ? "backgroundLibrary.collapsePanel" : "backgroundLibrary.expandPanel")}</small>
                    </span>
                    {open ? <ChevronDown size={20}/> : <ChevronUp size={20}/>}
                </button>
                <div className="wallpaperStudioPeekNav">
                    <button type="button" aria-label={t("backgroundLibrary.previous")} onClick={() => change(-1)}><ChevronLeft size={18}/></button>
                    <span className="wallpaperStudioCounter">{currentIndex + 1} / {items.length}</span>
                    <button type="button" aria-label={t("backgroundLibrary.next")} onClick={() => change(1)}><ChevronRight size={18}/></button>
                </div>
            </div>
            <div id="wallpaperStudioContent" className="wallpaperStudioSheetContent" inert={!open}>
                <div className="wallpaperStudioTabs">
                    <span>{t(settingsPage ? "backgroundLibrary.previewSettings" : "backgroundLibrary.previewBackgrounds")}</span>
                    <button type="button" className="wallpaperStudioHelp" aria-label={t("backgroundLibrary.help")}
                        title={t("backgroundLibrary.help")}
                        onClick={() => setBlackout({ seted: true, module: "BackgroundHelp" })}><CircleHelp size={20}/></button>
                </div>

                {!settingsPage ? <div className="wallpaperStudioScroll">
                    {backgroundGroups.map(group => {
                        const groupItems = items.map((item, index) => ({ item, index })).filter(({ item }) => item.group === group.id);
                        return <section className="wallpaperStudioGroup" key={group.id}>
                            <button type="button" className="wallpaperStudioGroupHeading"
                                aria-expanded={!collapsedGroups.includes(group.id)}
                                onClick={() => setCollapsedGroups(groups => groups.includes(group.id) ? groups.filter(value => value !== group.id) : [...groups, group.id])}>
                                <span>{t("backgroundLibrary." + group.id)}</span><ChevronDown size={19}/>
                            </button>
                            {!collapsedGroups.includes(group.id) && <div className="wallpaperStudioGrid">
                                {groupItems.map(({ item, index }) => tile(item, index))}
                            </div>}
                        </section>;
                    })}
                    <section className="wallpaperStudioGroup">
                        <div className="wallpaperStudioGroupHeading">
                            {t("backgroundLibrary.custom")} ({bgGallery.length}/6)
                        </div>
                        <div className="wallpaperStudioGrid">
                            {items.map((item, index) => ({ item, index })).filter(({ item }) => item.group === "custom").map(({ item, index }) => tile(item, index))}
                            {bgGallery.length < 6 && <button type="button" className="wallpaperStudioAdd"
                                onClick={() => fileRef.current?.click()}><ImagePlus size={23}/>{t("backgroundLibrary.add")}</button>}
                        </div>
                    </section>
                    <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) setBlackout({ seted: true, module: "BgHandler", bg: file });
                        }}/>
                    <p className="wallpaperStudioHoldHint">{t("backgroundLibrary.holdToPreview")}</p>
                </div> : <div className="wallpaperStudioScroll wallpaperStudioSettings">
                    {current.id === "default" && <ContourPatternPicker value={contourPattern} onChange={setContourPattern} size={contourSize} onSizeChange={setContourSize}/>}
                    {current.id === "art" && <ContourPatternPicker value={artPattern} onChange={setArtPattern} size={artSize} onSizeChange={setArtSize} subject="art"/>}
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
                        <div className="backgroundEffectsFilters backgroundFullscreenFilters">
                            {(["none", "grayscale", "sepia", "invert", "contrast", "saturate"] as const).map(filter => (
                                <button type="button" key={filter} data-filter={filter}
                                    className={bgEffects.filter === filter ? "active" : ""}
                                    onClick={() => updateEffects({ ...bgEffects, filter })}>
                                    {t("backgroundLibrary." + filter)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="button" className="wallpaperStudioReset" onClick={() => updateEffects({
                        blur: 0, movement: false, filter: "none", speed: 1
                    })}><RotateCcw size={18}/>{t("backgroundLibrary.previewReset")}</button>
                </div>}
            </div>
        </div>
        <PageBottom className="wallpaperStudioBottom" onBack={() => navigate("/settings/pers")}>
            <button type="button" className="pageBottomAction wallpaperStudioSettingsButton"
                onClick={() => navigate(settingsPage ? "/wallpapers" : "/wallpapers/settings")}>
                {settingsPage ? <Images size={21}/> : <Settings2 size={21}/>}
                {t(settingsPage ? "backgroundLibrary.previewBackgrounds" : "backgroundLibrary.previewSettings")}
            </button>
        </PageBottom>
        {holding && <div className="wallpaperStudioHoldState" aria-live="polite">{t("backgroundLibrary.releaseToPreview")}</div>}
    </main>;
}
