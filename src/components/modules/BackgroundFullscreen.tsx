import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, TouchEvent } from "react";
import { ArrowsInIcon } from "@phosphor-icons/react";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Settings2 } from "lucide-react";
import { AnimatePresence, motion, animate, useMotionValue, useReducedMotion } from "framer-motion";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import type { BackgroundEffects, ContourPattern } from "../context/SettingsContext";
import { Background } from "../ts/utils/background";
import { backgroundGroups } from "../ts/utils/backgroundCatalog";
import { BackgroundHelpButton } from "./BackgroundHelp";
import { supportsBackgroundMotion } from "../ts/utils/BackgroundScene";
import { ContourPatternPicker } from "../../pages/Settings/components/ContourPatternPicker";
import SeekBar from "../../pages/Settings/components/SeekBar";
import Selector from "../ts/Selector";
import Toggler from "../ts/Toggler";
import PageBottom from "../ts/PageBottom";
import "./scss/BackgroundFullscreen.scss";

type PreviewItem = { id: string; url?: string; label: string };

export default function BackgroundFullscreen() {
    const { t } = useTranslation("settings");
    const { blackout, setBlackout } = useBlackout();
    const { bgGallery, bgEffects, contourPattern, contourSize, artPattern, artSize, wallpaperStyle } = useSettings();
    const [ previewEffects, setPreviewEffects ] = useState<BackgroundEffects>(() => ({ ...bgEffects }));
    const [ previewPattern, setPreviewPattern ] = useState<ContourPattern>(() => contourPattern);
    const [ previewContourSize, setPreviewContourSize ] = useState(() => contourSize);
    const [ previewArtPattern, setPreviewArtPattern ] = useState<ContourPattern>(() => artPattern);
    const [ previewArtSize, setPreviewArtSize ] = useState(() => artSize);
    const [ panelTab, setPanelTab ] = useState<"backgrounds" | "settings">("backgrounds");
    const [ galleryPage, setGalleryPage ] = useState(0);
    const galleryX = useMotionValue(0);
    const galleryViewport = useRef<HTMLDivElement>(null);
    const galleryPointer = useRef<{ id: number; x: number; y: number; started: number; horizontal: boolean } | null>(null);
    const galleryMoving = useRef(false);
    const galleryBlockClick = useRef(false);
    const reduceMotion = useReducedMotion();
    const [ panelOpen, setPanelOpen ] = useState(false);
    const [ closing, setClosing ] = useState(false);
    const [ index, setIndex ] = useState(() => {
        const all = backgroundGroups.reduce<{ id: string; labelKey: string }[]>((list, group) => {
            group.items.forEach(item => list.push(item));
            return list;
        }, []);
        if (blackout.options?.id === "custom") {
            const selected = bgGallery.findIndex(item => item.url === blackout.options?.url);
            return selected < 0 ? 0 : all.length + selected;
        }
        const selected = all.findIndex(item => item.id === blackout.options?.id);
        return selected < 0 ? 0 : selected;
    });

    const items = useMemo<PreviewItem[]>(() => [
        ...backgroundGroups.reduce<PreviewItem[]>((list, group) => {
            group.items.forEach(item => list.push({ id: item.id, label: t(item.id === "color" ? (wallpaperStyle.logoEnabled ? "backgroundLibrary.logo" :
                wallpaperStyle.fillMode === "gradient" ? "backgroundLibrary.gradientBackground" : "personalization.solidColor") : item.labelKey) }));
            return list;
        }, []),
        ...bgGallery.map(item => ({
            id: "custom",
            url: item.url,
            label: t("backgroundLibrary.customWallpaper")
        }))
    ], [bgGallery, t, wallpaperStyle.fillMode, wallpaperStyle.logoEnabled]);

    const currentIndex = Math.min(index, items.length - 1);
    const current = items[currentIndex];
    const pageSize = 6;
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(galleryPage, pageCount - 1);
    const moving = useRef(false);
    const startTouch = useRef<{ x: number; y: number } | null>(null);
    const horizontalGesture = useRef(false);
    const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
    const pointerGesture = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const viewRef = useRef<HTMLDivElement>(null);
    const dragX = useMotionValue(0);
    const motionAvailable = supportsBackgroundMotion(current.id);

    const changeGalleryPage = (step: number) => {
        const nextPage = currentPage + step;
        if (nextPage < 0 || nextPage >= pageCount || galleryMoving.current) return;

        galleryMoving.current = true;
        const width = galleryViewport.current?.clientWidth ?? 1;
        animate(galleryX, -step * width, {
            duration: reduceMotion ? 0 : .32,
            ease: [.22, 1, .36, 1],
            onComplete: () => {
                flushSync(() => setGalleryPage(nextPage));
                galleryX.set(0);
                galleryMoving.current = false;
            }
        });
    };

    const handleGalleryPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (galleryMoving.current || event.button !== 0) return;
        galleryBlockClick.current = false;
        galleryPointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            started: performance.now(),
            horizontal: false
        };
    };

    const handleGalleryPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = galleryPointer.current;
        if (!start || start.id !== event.pointerId || galleryMoving.current) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.horizontal && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            if (Math.abs(dy) >= Math.abs(dx)) {
                galleryPointer.current = null;
                return;
            }
            start.horizontal = true;
            galleryBlockClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (start.horizontal) {
            const canGo = dx < 0 ? currentPage < pageCount - 1 : currentPage > 0;
            galleryX.set(canGo ? dx : dx * .2);
        }
    };

    const handleGalleryPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = galleryPointer.current;
        if (!start || start.id !== event.pointerId) return;
        galleryPointer.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (!start.horizontal) return;

        const dx = event.clientX - start.x;
        const elapsed = Math.max(1, performance.now() - start.started);
        const step = dx < 0 ? 1 : -1;
        if ((Math.abs(dx) > 45 || Math.abs(dx / elapsed) > .6) &&
            currentPage + step >= 0 && currentPage + step < pageCount) {
            changeGalleryPage(step);
        } else {
            animate(galleryX, 0, { duration: reduceMotion ? 0 : .22, ease: [.22, 1, .36, 1] });
        }
    };

    const galleryPageFor = (offset: number) => {
        const page = currentPage + offset;
        if (page < 0 || page >= pageCount) return null;
        return <div className="backgroundFullscreenChoices" key={offset}
            style={{ left: `${offset * 100}%` }}>
            {items.slice(page * pageSize, (page + 1) * pageSize).map((item, position) => {
                const itemIndex = page * pageSize + position;
                return <button type="button" key={item.id + (item.url ?? "")}
                    className={itemIndex === currentIndex ? "active" : ""}
                    onClick={() => {
                        if (galleryBlockClick.current || galleryMoving.current || moving.current) return;
                        dragX.set(0);
                        setIndex(itemIndex);
                        setGalleryPage(Math.floor(itemIndex / pageSize));
                        setPanelOpen(false);
                    }}>
                    <span className="backgroundFullscreenChoiceThumb">
                        <Background previewBg={item.id} previewUrl={item.url}
                            previewEffects={previewEffects} previewContourPattern={previewPattern} previewContourSize={previewContourSize}
                            previewArtPattern={previewArtPattern} previewArtSize={previewArtSize}/>
                    </span>
                    <span>{item.label}</span>
                </button>;
            })}
        </div>;
    };

    const close = useCallback(() => {
        if (timer.current) return;
        setClosing(true);
        timer.current = setTimeout(() => setBlackout({ seted: false }), 280);
    }, [setBlackout]);

    const changeSlide = useCallback((step: number) => {
        if (moving.current || items.length < 2 || closing) return;
        moving.current = true;
        const width = viewRef.current?.clientWidth ?? window.innerWidth;
        animate(dragX, -step * width, {
            duration: .25,
            ease: [.22, 1, .36, 1],
            onComplete: () => {
                const next = (currentIndex + step + items.length) % items.length;
                dragX.set(0);
                setIndex(next);
                setGalleryPage(Math.floor(next / pageSize));
                moving.current = false;
            }
        });
        setPanelOpen(false);
    }, [closing, currentIndex, dragX, items.length]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (blackout.module !== "BackgroundFullscreen") return;
            if ((event.target as HTMLElement)?.closest("input, textarea, select")) return;
            if (event.key === "Escape") {
                event.stopPropagation();
                if (panelOpen) setPanelOpen(false);
                else close();
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                changeSlide(1);
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                changeSlide(-1);
            }
        };
        document.addEventListener("keydown", onKeyDown, true);
        return () => document.removeEventListener("keydown", onKeyDown, true);
    }, [blackout.module, changeSlide, close, panelOpen]);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
        dragX.stop();
    }, [dragX]);

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        if (moving.current || panelOpen || event.touches.length !== 1 ||
            (event.target as HTMLElement).closest("button, input, .backgroundFullscreenPanel, .backgroundFullscreenInfo")) {
            startTouch.current = null;
            return;
        }
        startTouch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        horizontalGesture.current = false;
    };

    const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        if (!startTouch.current || event.touches.length !== 1) return;
        const dx = event.touches[0].clientX - startTouch.current.x;
        const dy = event.touches[0].clientY - startTouch.current.y;
        if (!horizontalGesture.current && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            if (Math.abs(dy) > Math.abs(dx)) {
                startTouch.current = null;
                return;
            }
            horizontalGesture.current = true;
        }
        if (horizontalGesture.current) {
            event.stopPropagation();
            if (event.cancelable) event.preventDefault();
            dragX.set(dx);
        }
    };

    const handleTouchEnd = () => {
        if (startTouch.current && horizontalGesture.current) {
            const dx = dragX.get();
            if (Math.abs(dx) > Math.min(100, (viewRef.current?.clientWidth ?? window.innerWidth) * .2)) {
                changeSlide(dx < 0 ? 1 : -1);
            } else {
                animate(dragX, 0, { type: "spring", stiffness: 420, damping: 34 });
            }
        }
        startTouch.current = null;
        horizontalGesture.current = false;
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" || event.button !== 0 || panelOpen || moving.current ||
            (event.target as Element).closest("button, input, .backgroundFullscreenPanel, .backgroundFullscreenInfo")) return;
        pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
        pointerGesture.current = false;
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" || !pointerStart.current || pointerStart.current.id !== event.pointerId) return;
        const dx = event.clientX - pointerStart.current.x;
        const dy = event.clientY - pointerStart.current.y;
        if (!pointerGesture.current && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
            if (Math.abs(dy) >= Math.abs(dx)) {
                pointerStart.current = null;
                return;
            }
            pointerGesture.current = true;
        }
        if (pointerGesture.current) dragX.set(dx);
    };

    const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "touch" || !pointerStart.current || pointerStart.current.id !== event.pointerId) return;
        const moved = pointerGesture.current;
        const dx = dragX.get();
        pointerStart.current = null;
        pointerGesture.current = false;
        if (!moved) return;
        if (Math.abs(dx) >= Math.min(100, (viewRef.current?.clientWidth ?? window.innerWidth) * .2)) {
            changeSlide(dx < 0 ? 1 : -1);
        } else {
            animate(dragX, 0, { type: "spring", stiffness: 420, damping: 34 });
        }
    };

    const slideFor = (offset: number) => {
        const item = items[(currentIndex + offset + items.length) % items.length];
        return <div key={offset} className="backgroundFullscreenSlide"
            style={{ left: `${offset * 100}%` }}>
            <Background previewBg={item.id} previewUrl={item.url}
                previewEffects={previewEffects} previewContourPattern={previewPattern} previewContourSize={previewContourSize}
                previewArtPattern={previewArtPattern} previewArtSize={previewArtSize}/>
        </div>;
    };

    return <div ref={viewRef} className={`backgroundFullscreenView ${closing ? "closing" : ""}`}
        role="dialog" aria-modal="true" aria-label={t("backgroundLibrary.preview")}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd}
        onClick={event => {
            if (panelOpen && !(event.target as Element).closest(".backgroundFullscreenPanel, .backgroundFullscreenInfo")) {
                setPanelOpen(false);
            }
        }}>
        <motion.div className="backgroundFullscreenDeck" style={{ x: dragX }}>
            {items.length > 1 && slideFor(-1)}
            {slideFor(0)}
            {items.length > 1 && slideFor(1)}
        </motion.div>

        {items.length > 1 && <>
            <button type="button" className="backgroundFullscreenArrow backgroundFullscreenArrowLeft"
                title={t("backgroundLibrary.previous")} aria-label={t("backgroundLibrary.previous")}
                onClick={() => changeSlide(-1)}><ChevronLeft/></button>
            <button type="button" className="backgroundFullscreenArrow backgroundFullscreenArrowRight"
                title={t("backgroundLibrary.next")} aria-label={t("backgroundLibrary.next")}
                onClick={() => changeSlide(1)}><ChevronRight/></button>
        </>}

        <AnimatePresence initial={false}>
        {panelOpen && <motion.div className="backgroundFullscreenPanel"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : .975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : .975 }}
            transition={{ duration: reduceMotion ? 0 : .24, ease: [.22, 1, .36, 1] }}
            onTouchStart={event => event.stopPropagation()}
            onTouchMove={event => event.stopPropagation()}>
            <Selector arr={[
                { label: t("backgroundLibrary.previewBackgrounds"), value: "backgrounds" as const, func: setPanelTab },
                { label: t("backgroundLibrary.previewSettings"), value: "settings" as const, func: setPanelTab }
            ]} selected={panelTab}/>
            {panelTab === "backgrounds" ? <>
                <div className="backgroundFullscreenPanelHeader">
                    <span>{t("backgroundLibrary.previewBackgrounds")}</span>
                    <div className="backgroundFullscreenPanelMeta">
                        <span>{t("backgroundLibrary.previewOnly")}</span>
                        <BackgroundHelpButton/>
                    </div>
                </div>
                <div className="backgroundFullscreenChoicesViewport" ref={galleryViewport}
                    onPointerDown={handleGalleryPointerDown}
                    onPointerMove={handleGalleryPointerMove}
                    onPointerUp={handleGalleryPointerEnd}
                    onPointerCancel={handleGalleryPointerEnd}
                    onClickCapture={event => {
                        if (!galleryBlockClick.current) return;
                        event.preventDefault();
                        event.stopPropagation();
                        galleryBlockClick.current = false;
                    }}>
                    <motion.div className="backgroundFullscreenChoicesTrack" style={{ x: galleryX }}>
                        {galleryPageFor(-1)}
                        {galleryPageFor(0)}
                        {galleryPageFor(1)}
                    </motion.div>
                </div>
                <div className="backgroundFullscreenPagination">
                    <button type="button" disabled={currentPage === 0}
                        aria-label={t("backgroundLibrary.previous")}
                        onClick={() => changeGalleryPage(-1)}><ChevronLeft/></button>
                    <span>{currentPage + 1} / {pageCount}</span>
                    <button type="button" disabled={currentPage >= pageCount - 1}
                        aria-label={t("backgroundLibrary.next")}
                        onClick={() => changeGalleryPage(1)}><ChevronRight/></button>
                </div>
            </> : <>
            <div className="backgroundFullscreenPanelHeader">
                <span>{t("backgroundLibrary.previewSettings")}</span>
                <button type="button" className="backgroundFullscreenReset"
                    onClick={() => {
                        setPreviewEffects({ ...bgEffects });
                        setPreviewPattern(contourPattern);
                        setPreviewContourSize(contourSize);
                        setPreviewArtPattern(artPattern);
                        setPreviewArtSize(artSize);
                    }} title={t("backgroundLibrary.previewReset")}>
                    <RotateCcw size={16}/> {t("backgroundLibrary.previewReset")}
                </button>
            </div>
            {current.id === "default" && <ContourPatternPicker value={previewPattern} onChange={setPreviewPattern}
                size={previewContourSize} onSizeChange={setPreviewContourSize}/>}
            {current.id === "art" && <ContourPatternPicker value={previewArtPattern} onChange={setPreviewArtPattern}
                size={previewArtSize} onSizeChange={setPreviewArtSize} subject="art"/>}
            <div className="backgroundFullscreenControl">
                <span>{t("backgroundLibrary.blurBackground")}</span>
                <SeekBar id="previewBlur" min={0} max={30} step={1} unit="px"
                    value={previewEffects.blur} disabled={false}
                    onChange={blur => setPreviewEffects(value => ({ ...value, blur }))}/>
            </div>
            <button type="button" className={`backgroundFullscreenMovement ${!motionAvailable ? "disabled" : ""}`}
                disabled={!motionAvailable}
                onClick={() => setPreviewEffects(value => ({ ...value, movement: !value.movement }))}>
                {t("backgroundLibrary.movement")}
                <Toggler state={motionAvailable && previewEffects.movement} disable={!motionAvailable}/>
            </button>
            <div className="backgroundFullscreenControl">
                <span className={!motionAvailable ? "disabled" : ""}>{t("backgroundLibrary.speed")}</span>
                <SeekBar id="previewSpeed" min={0} max={3} step={.25} unit="×"
                    value={previewEffects.speed} disabled={!motionAvailable}
                    onChange={speed => setPreviewEffects(value => ({ ...value, speed }))}/>
            </div>
            <span>{t("backgroundLibrary.filters")}</span>
            <div className="backgroundEffectsFilters backgroundFullscreenFilters">
                {(["none", "grayscale", "sepia", "invert", "contrast", "saturate"] as const).map(filter => (
                    <button type="button" key={filter} data-filter={filter}
                        className={previewEffects.filter === filter ? "active" : ""}
                        onClick={() => setPreviewEffects(value => ({ ...value, filter }))}>
                        {t(`backgroundLibrary.${filter}`)}
                    </button>
                ))}
            </div>
            </>}
        </motion.div>}
        </AnimatePresence>

        <PageBottom className="backgroundFullscreenBottom">
            <button type="button" className="pageBottomBack backgroundFullscreenExit"
                aria-label={t("backgroundLibrary.exitPreview")}
                title={t("backgroundLibrary.exitPreview")}
                onClick={close}>
                <ArrowsInIcon/>
            </button>
            <button type="button" className="modulesenderInfo backgroundFullscreenInfo"
                aria-expanded={panelOpen} onClick={() => {
                    setGalleryPage(Math.floor(currentIndex / pageSize));
                    setPanelOpen(open => !open);
                }}>
                <span className="senderInfoPic">
                    <Settings2 size={24}/>
                </span>
                <span className="senderInfoMain">
                    <span>{current.label}</span>
                    <span>{currentIndex + 1} / {items.length}</span>
                </span>
                <ChevronDown size={18} className={panelOpen ? "rotated" : ""}/>
            </button>
        </PageBottom>
    </div>;
}
