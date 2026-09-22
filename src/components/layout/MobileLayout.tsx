import {useEffect, useRef, type ReactNode } from "react";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SM/SideMenu";
import { useLocation } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";
import SMnav from "../ts/SM/SMnav";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const { decor } = useSettings();
    const location = useLocation();
    const { setShowSideMenu, translateX, isDragging, setIsDragging, setTranslateX, dontHandle, setDontHandleOther, setDontHandle } = useSideMenu();

    const startX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        const activeElement = document.activeElement;

        const isInputFocused =
            activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA";

        if (isInputFocused) {
            setDontHandleOther(true);
            setIsDragging(false);
            setDontHandle(true);
            return;
        }

        startX.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || dontHandle) return;
        const clientX = e.touches[0].clientX;
        const diff = clientX - startX.current;
        const percent = ((diff - 5) / window.innerWidth) * 100;
        if (diff < 1) {
            setTranslateX(-100)
            return
        }
        let next = -100 + percent;
        next = Math.max(-100, Math.min(0, next));
        setDontHandleOther(true)
        setTranslateX(next);
    };


    const handleTouchEnd = () => {
        if (!isDragging) return;

        setDontHandleOther(false)
        setIsDragging(false);

        const target = translateX > -50 ? 0 : -100;
        const start = translateX;
        const duration = 400;
        const startTime = performance.now();

        const animate = (time: number) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const next = start + (target - start) * eased;

            setTranslateX(next);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (target === -100) {
                setShowSideMenu(false);
            }
        };

        requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (translateX > -100) {
            setDontHandleOther(true)
        }
    }, [setDontHandleOther, translateX])

    const hideHeader =
        location.pathname.startsWith("/chat") ||
        location.pathname.startsWith("/habit/");

const backgroundWidth = decor === "glass"
    ? `calc(${Math.max(0, 100 + translateX)}% - ${15 * Math.pow(Math.max(0, 100 - Math.max(0, 100 + translateX)) / 100, 0.25)}px)`
    : (100 - translateX);
    
    console.log(translateX, backgroundWidth)
    return (
        <div className="mobile-layout">
            {!hideHeader && <Header />}

            <div
                className="sideMenuBackground"
                style={{
                    width: backgroundWidth,
                }}
            >
                <Background />
            </div>

            <SideMenu />
            <SMnav/>

            {decor === "glass" && <Background />}

            <div
                className="page-content"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onTouchCancel={handleTouchEnd}
            >
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}