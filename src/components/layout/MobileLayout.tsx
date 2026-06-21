import {useRef, type ReactNode } from "react";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SideMenu";
import { useLocation } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const { decor } = useSettings();
    const location = useLocation();
    const { setShowSideMenu, translateX, isDragging, setIsDragging, setTranslateX, dontHandle, setDontHandleOther } = useSideMenu();

    const startX = useRef(0);
    const startTranslate = useRef(0);
    const handleTouchStart = (e: React.TouchEvent) => {
        if (dontHandle) return
        startX.current = e.touches[0].clientX;
        startTranslate.current = translateX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || dontHandle) return;

        const clientX = e.touches[0].clientX;
        const diff = clientX - startX.current;

        if (diff > 10) {
            setDontHandleOther(true);
            const percent = (diff / window.innerWidth) * 100;

            let next = -100 + percent;
            next = Math.max(-100, Math.min(0, next));

            setTranslateX(next);
        } else {
            setDontHandleOther(false);
        }
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

    const hideHeader =
        location.pathname.startsWith("/chat") ||
        location.pathname.startsWith("/habit/");

    return (
        <div className="mobile-layout">
            {!hideHeader && <Header />}
            <SideMenu />

            {decor === "glass" && <Background />}

            <div
                className="page-content"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
                {decor === "default" && <Background />}
                {children}
            </div>
        </div>
    );
}