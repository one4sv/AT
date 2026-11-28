import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { isIosStandalone } from "../hooks/utils/VisualViewportHook";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import { useDrop } from "../hooks/DropHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SM/SideMenu";
import { useLocation } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useBlackout } from "../hooks/BlackoutHook";
import SMnav from "../ts/SM/SMnav";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import SMheader from "../ts/SM/SMheader";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const isMobile = useCompactLayout();
    const { decor } = useSettings();
    const { menu: contextMenu } = useContextMenu();
    const { blackout } = useBlackout();
    const location = useLocation();
    const { handleDrop, handleDragOver, handleDragEnter, handleDragLeave } = useDrop();
    const needDrag = location.pathname.startsWith("/post") || location.pathname.startsWith("/chat");
    const {
        openSideMenu,
        closeMenu,
        showSideMenu,
        translateX,
        setIsDragging,
        setTranslateX,
        dontHandle,
        setDontHandleOther,
        setDontHandle,
    } = useSideMenu();

    const startX = useRef(0);
    const startY = useRef(0);
    const startTranslate = useRef(-100);
    const currentTranslate = useRef(-100);
    const pageRef = useRef<HTMLDivElement>(null);
    const gesture = useRef<"none" | "menu" | "scroll">("none");
    const lastNavTouch = useRef(0);
    const navTouchStarted = useRef(false);
    const [keyboardWallpaper, setKeyboardWallpaper] = useState(false);

    useEffect(() => {
        if (!isIosStandalone()) return;
        const update = () => setKeyboardWallpaper(document.documentElement.dataset.atKeyboard === "true");
        update();
        window.addEventListener("at-keyboard-change", update);
        return () => window.removeEventListener("at-keyboard-change", update);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        gesture.current = "none";
        if (location.pathname.startsWith("/wallpapers") || e.touches.length !== 1 || dontHandle || contextMenu.visible || blackout.seted) {
            gesture.current = "scroll";
            return;
        }

        const target = e.target as Element;
        // data-context-menu does not own the touch until its long-press
        // activates. Messages, posts and settings cards must still allow
        // horizontal swipes; their context menu keeps priority once opened.
        if (target.closest("input, textarea, select, [contenteditable='true'], [data-header-gesture], .selector, .seekBarWrapper, .ContextMenuWrapper, .blackout, .scheduleDiv, .statsDivSlider")) {
            gesture.current = "scroll";
            return;
        }

        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTranslate.current = translateX;
        currentTranslate.current = translateX;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if ((e.target as Element).closest(".habitMenu, .scheduleDiv, .statsDivSlider, .seekBarWrapper")) return;
        if (contextMenu.visible || blackout.seted || dontHandle ||
            e.touches.length !== 1 || gesture.current === "scroll") return;

        const diffX = e.touches[0].clientX - startX.current;
        const diffY = e.touches[0].clientY - startY.current;

        if (gesture.current === "none") {
            if (Math.abs(diffX) < 8 && Math.abs(diffY) < 8) return;

            if (Math.abs(diffY) >= Math.abs(diffX) || (startTranslate.current <= -100 && diffX < 0)) {
                gesture.current = "scroll";
                return;
            }

            gesture.current = "menu";
            setIsDragging(true);
            setDontHandleOther(true);
        }

        if (e.cancelable) e.preventDefault();
        const percent = diffX / window.innerWidth * 100;
        const next = Math.max(-100, Math.min(0, startTranslate.current + percent));
        currentTranslate.current = next;
        setTranslateX(next);
    };

    const handleTouchEnd = () => {
        if (gesture.current === "menu" && !contextMenu.visible && !blackout.seted) {
            // Restore the original position-based snap: the menu travels with
            // the finger, then finishes on the side of the halfway point.
            if (currentTranslate.current > -50) openSideMenu();
            else closeMenu();
        }

        gesture.current = "none";
        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);
    };

    const handleTouchCancel = () => {
        gesture.current = "none";
        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);
        setTranslateX(showSideMenu ? 0 : -100);
    };

    const handleTouchMoveRef = useRef(handleTouchMove);
    handleTouchMoveRef.current = handleTouchMove;
    useEffect(() => {
        const element = pageRef.current;
        if (!element) return;
        const move = (event: TouchEvent) => handleTouchMoveRef.current(event);
        element.addEventListener("touchmove", move, { passive: false });
        return () => element.removeEventListener("touchmove", move);
    }, []);

    const hideHeader =
        location.pathname.startsWith("/chat") ||
        location.pathname.startsWith("/habit/") ||
        location.pathname.startsWith("/wallpapers");

    const backgroundWidth =
        decor === "glass"
            ? `calc(${Math.max(0, 100 + translateX)}% - ${15 * Math.pow(Math.max(0, 100 - Math.max(0, 100 + translateX)) / 100, 0.25)}px)`
            : 100 - translateX;

    return (
        <div className="mobile-layout"
            onTouchStartCapture={event => {
                navTouchStarted.current = event.target instanceof Element && !!event.target.closest(".SMnavDiv");
                if (!navTouchStarted.current) lastNavTouch.current = 0;
            }}
            onTouchEndCapture={event => {
                if (!event.touches.length && navTouchStarted.current) {
                    lastNavTouch.current = performance.now() + 500;
                    navTouchStarted.current = false;
                }
            }}
            onTouchCancelCapture={() => { navTouchStarted.current = false; }}
            onClickCapture={event => {
                const target = event.target;
                if (!(target instanceof Element) || target.closest(".sideMenu, .smHeader, .SMnavDiv")) return;
                if ((isMobile && showSideMenu) || (event.detail > 0 && performance.now() < lastNavTouch.current)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }}
        >
            {keyboardWallpaper && createPortal(<div className="atKeyboardWallpaper" aria-hidden="true"><Background/></div>, document.body)}
            {!hideHeader && <Header />}

            {isMobile && decor === "glass" ? (
                <div
                    className="sideMenuBackground"
                    style={{ width: backgroundWidth }}
                >
                    <Background />
                </div>
            ) : null}

            {<>
                <SMheader/>
                <SideMenu />
                <SMnav />
            </>}

            {decor === "glass" && <Background />}

            <div
                className="page-content"
                ref={pageRef}
                onDragOver={needDrag ? handleDragOver : undefined}
                onDragEnter={needDrag ? handleDragEnter : undefined}
                onDragLeave={needDrag ? handleDragLeave : undefined}
                onDrop={needDrag ? handleDrop : undefined}
                inert={isMobile && showSideMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
            >
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}