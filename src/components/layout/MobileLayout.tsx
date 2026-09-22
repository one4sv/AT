import { useEffect, useRef, type ReactNode } from "react";
import { Background } from "../ts/utils/background";
import { useSettings } from "../hooks/SettingsHook";
import Header from "../ts/Header";
import SideMenu from "../ts/SM/SideMenu";
import { useLocation } from "react-router-dom";
import { useSideMenu } from "../hooks/SideMenuHook";
import SMnav from "../ts/SM/SMnav";
import { isMobile } from "react-device-detect";

interface LayoutProps {
    children?: ReactNode;
}

export default function MobileLayout({ children }: LayoutProps) {
    const { decor } = useSettings();
    const location = useLocation();
    const {
        toggleMenu,
        translateX,
        isDragging,
        setIsDragging,
        setTranslateX,
        dontHandle,
        setDontHandleOther,
        setDontHandle,
    } = useSideMenu();

    const startX = useRef(0);
    const startY = useRef(0);
    const gesture = useRef<"none" | "menu" | "scroll">("none"); // тип жеста фиксируем один раз

    const handleTouchStart = (e: React.TouchEvent) => {
        const activeElement = document.activeElement;

        const isInputFocused =
            activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA";

        if (isInputFocused) {
            setDontHandleOther(true);
            setIsDragging(false);
            setDontHandle(true);
            gesture.current = "none";
            return;
        }

        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        gesture.current = "none";
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || dontHandle) return;

        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        const diffX = clientX - startX.current;
        const diffY = clientY - startY.current;

        // === Решаем тип жеста только один раз ===
        if (gesture.current === "none") {
            const absX = Math.abs(diffX);
            const absY = Math.abs(diffY);

            // Ещё слишком мало движения — ждём
            if (absX < 8 && absY < 8) return;

            if (absY > absX) {
                // Вертикаль победила → это скролл, меню не трогаем
                gesture.current = "scroll";
                setDontHandle(true);
                setIsDragging(false);
                return;
            }

            // Горизонталь победила → это меню
            gesture.current = "menu";
        }

        // Если уже решили, что скролл — ничего не делаем
        if (gesture.current === "scroll") return;

        // === Жест меню ===
        // (вертикаль больше не может его отменить)

        const percent = (diffX / window.innerWidth) * 100;
        let next = -100 + percent;
        next = Math.max(-100, Math.min(0, next));

        setDontHandleOther(true);
        setTranslateX(next);
    };

    const handleTouchEnd = () => {
        if (gesture.current === "menu") {
            // Всегда доводим анимацию до края
            toggleMenu();
        }

        gesture.current = "none";
        setIsDragging(false);
        // dontHandle сбрасывать не обязательно — toggleMenu/closeMenu сами это делают
    };

    useEffect(() => {
        if (translateX > -100) {
            setDontHandleOther(true);
        }
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

            <SideMenu />
            <SMnav />

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