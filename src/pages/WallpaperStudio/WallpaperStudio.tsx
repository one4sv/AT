import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion";
import { flushSync } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleHelp, ImagePlus, Trash2, Film, Palette, LayoutGrid, WandSparkles, Settings2, Images } from "lucide-react";
import { useSettings } from "../../components/hooks/SettingsHook";
import { useUpSettings } from "../../components/hooks/UpdateSettingsHook";
import Header from "../../components/ts/Header";
import PageBottom from "../../components/ts/PageBottom";
import useCompactLayout from "../../components/hooks/utils/useCompactLayout";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { api } from "../../components/ts/api";
import { Background } from "../../components/ts/utils/background";
import { backgroundGroups } from "../../components/ts/utils/backgroundCatalog";
import { supportsBackgroundMotion, isPhotographicScene } from "../../components/ts/utils/BackgroundScene";
import "./WallpaperStudio.scss";

type WallpaperItem = { id: string; url?: string; label: string; group: string };
type HandleDrag = { pointerId: number; x: number; y: number; moved: boolean; direction: "none" | "horizontal" | "vertical" };

export default function WallpaperStudio() {
    const { tab } = useParams<{ tab?: string }>();
    const settingsPage = tab === "settings";
    const navigate = useNavigate();
    const { t } = useTranslation("settings");
    const { bg, bgUrl, bgGallery, setBgUrl, refetchSettings, layout } = useSettings();
    const { setNewBg } = useUpSettings();
    const isMobile = useCompactLayout();
    const { blackout, setBlackout } = useBlackout();
    const reduceMotion = useReducedMotion();
    const [ open, setOpen ] = useState(false);
    const [ preview, setPreview ] = useState(0);
    const [ collapsedGroups, setCollapsedGroups ] = useState<string[]>([]);
    const [ busy, setBusy ] = useState(false);
    const [ sheetDrag, setSheetDrag ] = useState(0);
    const dragX = useMotionValue(0);
    const canvasRef = useRef<HTMLDivElement>(null);
    const changing = useRef(false);
    const slideAnimation = useRef<ReturnType<typeof animate> | null>(null);
    const canvasGesture = useRef<{ pointerId: number; x: number; y: number; axis: "none" | "horizontal" | "vertical"; moved: boolean } | null>(null);
    const handleDrag = useRef<HandleDrag | null>(null);
    const suppressClick = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const previewClickSuppressed = useRef(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);
    const wheelGesture = useRef({ total: 0, last: 0 });

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
    useEffect(() => {
        if (!settingsPage) return;
        setBlackout({ seted: true, module: "WallpaperSettings", options: { id: current?.id ?? bg } });
        navigate("/wallpapers", { replace: true });
    }, [settingsPage]);

    const change = useCallback((step: number) => {
        if (items.length < 2 || changing.current) return;
        changing.current = true;
        slideAnimation.current?.stop();
        const width = canvasRef.current?.clientWidth || window.innerWidth;
        slideAnimation.current = animate(dragX, step > 0 ? -width : width, {
            duration: reduceMotion ? 0 : .32,
            ease: [.22, 1, .36, 1],
            onComplete: () => {
                // Preserve the rendered neighboring image while it becomes the center frame.
                // Reset the offset in the same synchronous commit to avoid an empty paint.
                flushSync(() => {
                    dragX.set(0);
                    setPreview(index => (index + step + items.length) % items.length);
                });
                changing.current = false;
            }
        });
    }, [items.length, dragX, reduceMotion]);

    const view = (index: number) => {
        if (changing.current || !items.length) return;
        const next = (index + items.length) % items.length;
        if (next === currentIndex) return;
        if (next === (currentIndex + 1) % items.length) change(1);
        else if (next === (currentIndex - 1 + items.length) % items.length) change(-1);
        else {
            slideAnimation.current?.stop();
            dragX.set(0);
            setPreview(next);
        }
    };

    useEffect(() => () => {
        slideAnimation.current?.stop();
    }, []);

    const apply = (index: number) => {
        const item = items[index];
        if (!item || busy) return;
        setPreview(index);
        if (item.id === "custom") {
            setBgUrl(item.url ?? "");
            setNewBg("custom");
        } else {
            setNewBg(item.id);
        }
    };

    const onHandleDown = (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType !== "touch" && event.button !== 0) return;
        suppressClick.current = false;
        handleDrag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false, direction: "none" };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onHandleMove = (event: PointerEvent<HTMLButtonElement>) => {
        const start = handleDrag.current;
        if (!start || start.pointerId !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (start.direction === "none" && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            start.direction = Math.abs(dy) > Math.abs(dx) ? "vertical" : "horizontal";
        }
        if (start.direction !== "vertical") return;
        start.moved = true;
        setSheetDrag(Math.min(window.innerHeight * .9, Math.max(0, dy)));
    };

    const onHandleEnd = (event: PointerEvent<HTMLButtonElement>) => {
        const start = handleDrag.current;
        if (!start || start.pointerId !== event.pointerId) return;
        handleDrag.current = null;
        if (start.moved) suppressClick.current = true;
        if (event.type !== "pointercancel" && start.direction === "vertical") {
            const dy = event.clientY - start.y;
            if (dy > 65) setOpen(false);
        }
        setSheetDrag(0);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const onHandleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (suppressClick.current) {
            event.preventDefault();
            suppressClick.current = false;
            return;
        }
        setOpen(value => !value);
    };

    const handlePreviewWheel = (event: React.WheelEvent<HTMLElement>) => {
        if (isMobile) return;
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

    const handleCanvasDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (changing.current) return;
        slideAnimation.current?.stop();
        previewClickSuppressed.current = false;
        canvasGesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, axis: "none", moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handleCanvasMove = (event: PointerEvent<HTMLDivElement>) => {
        const gesture = canvasGesture.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;

        if (gesture.axis === "none") {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 7) return;
            gesture.axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
        }
        if (gesture.axis === "horizontal") {
            gesture.moved = true;
            const width = canvasRef.current?.clientWidth || window.innerWidth;
            dragX.set(Math.max(-width, Math.min(width, dx)));
        } else {
            gesture.moved = true;
            if ((!open && dy < 0) || (open && dy > 0)) {
                const height = window.innerHeight * .9;
                setSheetDrag(Math.max(-height, Math.min(height, dy)));
            }
        }
    };

    const handleCanvasEnd = (event: PointerEvent<HTMLDivElement>) => {
        const gesture = canvasGesture.current;
        if (!gesture || gesture.pointerId !== event.pointerId) return;
        canvasGesture.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (gesture.moved) previewClickSuppressed.current = true;

        if (gesture.axis === "horizontal") {
            const width = canvasRef.current?.clientWidth || window.innerWidth;
            const threshold = Math.min(110, width * .2);
            if (event.type !== "pointercancel" && Math.abs(dx) >= threshold) {
                change(dx < 0 ? 1 : -1);
            } else {
                slideAnimation.current = animate(dragX, 0, { type: "spring", stiffness: 420, damping: 34 });
            }
        } else if (gesture.axis === "vertical") {
            if (event.type !== "pointercancel" && Math.abs(dy) > 65) {
                if (!open && dy < 0) setOpen(true);
                else if (open && dy > 0) setOpen(false);
            }
            setSheetDrag(0);
        }
    };

    useEffect(() => {
        const scroll = scrollRef.current;
        if (!open || !scroll) return;

        let gesture: { x: number; y: number; distance: number; owns: boolean; canClose: boolean } | null = null;

        const start = (event: TouchEvent) => {
            if (event.touches.length !== 1) {
                gesture = null;
                return;
            }
            gesture = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                distance: 0,
                owns: false,
                canClose: scroll.scrollTop <= 2
            };
        };

        const move = (event: TouchEvent) => {
            if (!gesture || event.touches.length !== 1) return;
            const dx = event.touches[0].clientX - gesture.x;
            const dy = event.touches[0].clientY - gesture.y;

            if (!gesture.owns) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
                if (!gesture.canClose || dy <= 0 || Math.abs(dx) > Math.abs(dy) || scroll.scrollTop > 2) {
                    gesture.canClose = false;
                    return;
                }
                gesture.owns = true;
            }

            gesture.distance = Math.max(0, Math.min(window.innerHeight * .9, dy));
            event.stopPropagation();
            if (event.cancelable) event.preventDefault();
            setSheetDrag(gesture.distance);
        };

        const finish = (event: TouchEvent) => {
            if (gesture?.owns) {
                event.stopPropagation();
                if (event.type !== "touchcancel" && gesture.distance > 65) setOpen(false);
                setSheetDrag(0);
            }
            gesture = null;
        };

        const wheel = (event: WheelEvent) => {
            if (isMobile || event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
            if (scroll.scrollTop <= 2 && event.deltaY < -30) {
                event.preventDefault();
                setOpen(false);
            }
        };

        scroll.addEventListener("touchstart", start, { passive: true });
        scroll.addEventListener("touchmove", move, { passive: false });
        scroll.addEventListener("touchend", finish);
        scroll.addEventListener("touchcancel", finish);
        scroll.addEventListener("wheel", wheel, { passive: false });

        return () => {
            scroll.removeEventListener("touchstart", start);
            scroll.removeEventListener("touchmove", move);
            scroll.removeEventListener("touchend", finish);
            scroll.removeEventListener("touchcancel", finish);
            scroll.removeEventListener("wheel", wheel);
            setSheetDrag(0);
        };
    }, [open, isMobile]);

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

    const tile = (item: WallpaperItem, index: number) => (
        <div key={item.id + (item.url ?? "")} className="wallpaperStudioTile">
            <button type="button" className={"wallpaperStudioTileChoose" + (index === currentIndex ? " selected" : "") + (item.id === bg && (item.id !== "custom" || item.url === bgUrl) ? " applied" : "")}
                disabled={busy}
                onClick={() => view(index)}
                aria-label={t("backgroundLibrary.chooseWallpaper", { name: item.label })}
                title={item.label}>
                <span className="wallpaperStudioTileImage">
                    <Background previewBg={item.id} previewUrl={item.url}/>
                </span>
                {item.id === bg && (item.id !== "custom" || item.url === bgUrl) &&
                    <span className="wallpaperStudioApplied" aria-label={t("backgroundLibrary.selected")}>
                        <CircleCheck size={21}/>
                    </span>}
            </button>
            {item.id === "custom" && <button type="button" className="wallpaperStudioDelete"
                title={t("backgroundLibrary.delete")} aria-label={t("backgroundLibrary.delete")}
                onClick={() => deleteCustom(item.url ?? "")}><Trash2 size={18}/></button>}
        </div>
    );

    if (!current) return null;

    return <main className={"wallpaperStudio" + (open ? " expanded" : " collapsed")}
        onWheel={handlePreviewWheel}>
        <div className="wallpaperStudioCanvas" ref={canvasRef} aria-hidden="true">
            {[-1, 0, 1].map(offset => {
                const index = (currentIndex + offset + items.length) % items.length;
                const item = items[index];
                return <motion.div key={item.id + (item.url ?? "")}
                    className="wallpaperStudioFrame"
                    style={{ x: dragX, left: offset * 100 + "%" }}>
                    <Background previewBg={item.id} previewUrl={item.url}/>
                </motion.div>;
            })}
        </div>
        <div className="wallpaperStudioGestureSurface"
            onPointerDown={handleCanvasDown}
            onPointerMove={handleCanvasMove}
            onPointerUp={handleCanvasEnd}
            onPointerCancel={handleCanvasEnd}
            onClick={() => {
                if (previewClickSuppressed.current) {
                    previewClickSuppressed.current = false;
                    return;
                }
                if (open) setOpen(false);
            }}
            aria-hidden="true"/>

        <Header titleOverride={current.label} hideMenuButton={!isMobile && layout !== "hidden"}
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
            style={{ "--studio-drag": sheetDrag + "px" } as CSSProperties} aria-hidden={!open && !sheetDrag}>
            <button type="button" className="landingFooterHandle wallpaperStudioHandle"
                aria-label={t(open ? "backgroundLibrary.collapsePanel" : "backgroundLibrary.expandPanel")}
                aria-expanded={open} aria-controls="wallpaperStudioContent"
                onPointerDown={onHandleDown} onPointerMove={onHandleMove}
                onPointerUp={onHandleEnd} onPointerCancel={onHandleEnd}
                onClick={onHandleClick}>
                <span/>
            </button>
            <div id="wallpaperStudioContent" className="wallpaperStudioSheetContent" inert={!open && !sheetDrag}>
                <div className="wallpaperStudioTabs">
                    <span>{t("backgroundLibrary.previewBackgrounds")}</span>
                    <button type="button" className="wallpaperStudioHelp" aria-label={t("backgroundLibrary.help")}
                        title={t("backgroundLibrary.help")}
                        onClick={() => setBlackout({ seted: true, module: "BackgroundHelp" })}><CircleHelp size={20}/></button>
                </div>
                <div className="wallpaperStudioScroll" ref={scrollRef}>
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
                                aria-label={t("backgroundLibrary.add")} title={t("backgroundLibrary.add")}
                                onClick={() => fileRef.current?.click()}><ImagePlus size={23}/></button>}
                        </div>
                    </section>
                    <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) setBlackout({ seted: true, module: "BgHandler", bg: file });
                        }}/>
                </div>
            </div>
        </div>
        <PageBottom className="wallpaperStudioBottom" onBack={() => navigate("/settings/pers")}>
            <button type="button" className="pageBottomAction wallpaperStudioSettingsButton"
                aria-expanded={open} aria-controls="wallpaperStudioContent"
                onClick={() => setOpen(value => !value)}>
                <Images size={21}/>
                {t("backgroundLibrary.previewBackgrounds")}
            </button>
            <button type="button" className="pageBottomBack wallpaperStudioGearButton"
                aria-label={t("backgroundLibrary.previewSettings")}
                title={t("backgroundLibrary.previewSettings")}
                onClick={() => setBlackout({ seted: true, module: "WallpaperSettings", options: { id: current.id } })}>
                <Settings2 size={22}/>
            </button>
        </PageBottom>
    </main>;
}
