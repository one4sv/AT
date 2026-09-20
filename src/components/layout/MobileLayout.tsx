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
    const startTranslate = useRef(0);

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
        startTranslate.current = translateX;
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

        if (translateX > -50) {
            setTranslateX(0);
        } else {
            setTranslateX(-100);

            setTimeout(() => {
                setShowSideMenu(false);
            }, 300);
        }
    };

    useEffect(() => {
        if (translateX > -100) {
            setDontHandleOther(true)
        }
    }, [setDontHandleOther, translateX])

    const hideHeader =
        location.pathname.startsWith("/chat") ||
        location.pathname.startsWith("/habit/");

    return (
        <div className="mobile-layout">
            {!hideHeader && <Header />}
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