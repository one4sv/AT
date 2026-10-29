import { useEffect, useRef, type ReactNode } from "react";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SM/SideMenu";
import { useLocation } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";
import SMnav from "../ts/SM/SMnav";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import SMheader from "../ts/SM/SMheader";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const isMobile = useCompactLayout();
    const { decor } = useSettings();
    const location = useLocation();
    const {
        toggleMenu,
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
    const pageRef = useRef<HTMLDivElement>(null);
    const gesture = useRef<"none" | "menu" | "scroll">("none");

    const handleTouchStart = (e: React.TouchEvent) => {
        gesture.current = "none";
        if (e.touches.length !== 1 || dontHandle) return;

        const target = e.target as Element;
        if (target.closest("input, textarea, [contenteditable='true']")) {
            gesture.current = "scroll";
            return;
        }

        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTranslate.current = translateX;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (dontHandle || e.touches.length !== 1 || gesture.current === "scroll") return;

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
        setTranslateX(Math.max(-100, Math.min(0, startTranslate.current + percent)));
    };

    const handleTouchEnd = () => {
        if (gesture.current === "menu") toggleMenu();

        gesture.current = "none";
        setIsDragging(false);
        setDontHandle(false);
    };

    useEffect(() => {
        const element = pageRef.current;
        if (!element) return;

        element.addEventListener("touchmove", handleTouchMove, { passive: false });
        return () => element.removeEventListener("touchmove", handleTouchMove);
    });

    useEffect(() => {
        setDontHandleOther(translateX > -100);
    }, [setDontHandleOther, translateX]);

    const hideHeader =
        location.pathname.startsWith("/chat") ||
        location.pathname.startsWith("/habit/");

    const backgroundWidth =
        decor === "glass"
            ? `calc(${Math.max(0, 100 + translateX)}% - ${15 * Math.pow(Math.max(0, 100 - Math.max(0, 100 + translateX)) / 100, 0.25)}px)`
            : 100 - translateX;

    return (
        <div className="mobile-layout">
            {!hideHeader && <Header />}

            {isMobile && decor === "glass" ? (
                <div
                    className="sideMenuBackground"
                    style={{ width: backgroundWidth }}
                >
                    <Background />
                </div>
            ) : null}

            <SMheader/>
            <SideMenu />
            <SMnav />

            {decor === "glass" && <Background />}

            <div
                className="page-content"
                ref={pageRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}