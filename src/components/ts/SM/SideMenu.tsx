import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../../scss/SM/sideMenu.scss";
import HabitsList from "./HabitsList.tsx";
import { useUser } from "../../hooks/UserHook.ts";
import ContactsList from "./ContactsList.tsx";
import { useSettings } from "../../hooks/SettingsHook.ts";
import { useHabits } from "../../hooks/HabitsHook.ts";
import Skeleton from "../Skeleton";
import useCompactLayout from "../../hooks/utils/useCompactLayout";
import { useSchedule } from "../../hooks/ScheduleHook.ts";
import SideMenuUnAunthificated from "../SideMenuUnAunthificated.tsx";
import { useSideMenu } from "../../hooks/SideMenuHook.ts";
import { useContextMenu } from "../../hooks/ContextMenuHook.ts";
import { useContacts } from "../../hooks/ContactsHook.ts";
import AccountList from "./AccountList.tsx";
import SpotsList from "./SpotsList.tsx";

export default function SideMenu() {
    const isMobile = useCompactLayout();
    const studio = useLocation().pathname.startsWith("/wallpapers");
    const {
        user,
        isAuthenticated,
        loadingUser
    } = useUser();
    const {
        list,
        loadingList,
        search: contactSearch,
        mainSearchRef
    } = useContacts();
    const {
        habits,
        loadingHabits
    } = useHabits();
    const { refreshSchedules } = useSchedule();
    const { layout } = useSettings();
    const { menu } = useContextMenu();
    const {
        closeMenu,
        openSideMenu,
        activeTab,
        startupTabAnimationReady,
        showSideMenu,
        setIsDragging,
        translateX,
        setTranslateX,
        messageSelectedValue,
        habitsSelectedValue,
        setDontHandle,
        setDontHandleOther,
        dontHandleOther
    } = useSideMenu();
    const translateSlider = activeTab === "chats" ? 0 : activeTab === "habits" ? -25 : activeTab === "spots" ? -50 : activeTab === "user" ? -75 : 0;
    const startX = useRef(0);
    const startY = useRef(0);
    const startTranslate = useRef(0);
    const currentTranslate = useRef(0);
    const horizontalSwipe = useRef(false);
    const verticalScroll = useRef(false);
    const contextGesture = useRef(false);
    const sideMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = sideMenuRef.current;
        const nav = document.querySelector<HTMLElement>(".SMnavDiv");
        if (!container || !nav) return;

        const updateClearance = () => {
            const bottom = container.getBoundingClientRect().bottom;
            const navTop = nav.getBoundingClientRect().top;
            container.style.setProperty("--sm-nav-clearance", Math.ceil(Math.max(0, bottom - navTop)) + "px");
        };
        updateClearance();
        const observer = new ResizeObserver(updateClearance);
        observer.observe(container);
        observer.observe(nav);
        window.addEventListener("resize", updateClearance);
        window.visualViewport?.addEventListener("resize", updateClearance);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updateClearance);
            window.visualViewport?.removeEventListener("resize", updateClearance);
            container.style.removeProperty("--sm-nav-clearance");
        };
    }, [isAuthenticated, loadingUser]);

    useEffect(() => {
        if (user.id) refreshSchedules();
    }, [user.id, refreshSchedules]);

    useEffect(() => {
        if (!menu.visible) return;
        contextGesture.current = true;
        horizontalSwipe.current = false;
        verticalScroll.current = false;
        setIsDragging(false);
        setTranslateX(showSideMenu ? 0 : -100);
    }, [menu.visible, showSideMenu, setIsDragging, setTranslateX]);
    
    const handleTouchStart = (e: React.TouchEvent) => {
        if (studio && !isMobile) {
            contextGesture.current = true;
            return;
        }
        contextGesture.current = menu.visible ||
            !!(e.target instanceof Element && e.target.closest("[data-context-menu], [data-header-gesture], .selector, .ContextMenuWrapper, .blackout"));
        if (contextGesture.current || e.touches.length !== 1) return;
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTranslate.current = translateX;
        currentTranslate.current = translateX;
        horizontalSwipe.current = false;
        verticalScroll.current = false;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        // ContextMenu retains ownership even if it closes before touchend bubbles.
        if (menu.visible || contextGesture.current) {
            contextGesture.current = true;
            horizontalSwipe.current = false;
            verticalScroll.current = false;
            return;
        }
        if (dontHandleOther && !horizontalSwipe.current) return;
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const diffPx = clientX - startX.current;
        const diffPy = clientY - startY.current;
        if (!horizontalSwipe.current && !verticalScroll.current) {
            if (Math.abs(diffPy) >= 8 || Math.abs(diffPx) >= 8) {
                if (Math.abs(diffPy) > Math.abs(diffPx)) {
                    verticalScroll.current = true;
                    setDontHandle(true);
                    return;
                }
                horizontalSwipe.current = true;
                setIsDragging(true);
                setDontHandleOther(true);
                setDontHandle(false);
            }
        }
        if (!horizontalSwipe.current) return;
        const diffPercent = diffPx / window.innerWidth * 100;
        let newTranslate = startTranslate.current + diffPercent;
        newTranslate = Math.max(-100, Math.min(0, newTranslate));
        currentTranslate.current = newTranslate;
        setTranslateX(newTranslate);
    };
    const handleTouchEnd = () => {
        if (menu.visible || contextGesture.current) {
            contextGesture.current = false;
            horizontalSwipe.current = false;
            verticalScroll.current = false;
            setIsDragging(false);
            return;
        }
        if (!horizontalSwipe.current) {
            setDontHandle(false);
            verticalScroll.current = false;
            horizontalSwipe.current = false;
            return;
        }
        setIsDragging(false);
        setDontHandle(false);
        // Original SM drag settling: finish according to the actual menu
        // position, not the swipe direction or a fixed distance in pixels.
        if (currentTranslate.current < -18) closeMenu();
        else openSideMenu();
        horizontalSwipe.current = false;
        verticalScroll.current = false;
    };

    useEffect(
        () => {
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                if (isMobile || layout !== "hidden" || !showSideMenu || menu.visible) return;
                // SMnav and SMheader belong to the SideMenu as a logical component,
                // even though the layout renders them beside .sideMenu in the DOM.
                const target = event.target;
                if (target instanceof Element && target.closest(".sideMenu, .SMnavDiv, .smHeader")) return;
                if (sideMenuRef.current && !sideMenuRef.current.contains(target as Node)) {
                    closeMenu();
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        },
        [layout, showSideMenu, closeMenu, menu.visible, isMobile, studio]
    );
    if (!isAuthenticated && !loadingUser) {
        return <SideMenuUnAunthificated
            ref={sideMenuRef}
            onTouchS={handleTouchStart}
            onTouchM={handleTouchMove}
            onTouchE={handleTouchEnd}
            translateX={translateX}
            onTouchCancel={() => {
                contextGesture.current = false;
                horizontalSwipe.current = false;
                verticalScroll.current = false;
                setIsDragging(false);
                setDontHandle(false);
                if (!menu.visible) setTranslateX(showSideMenu ? 0 : -100);
            }}
        />;
    }

    return (
        <div
            className={`sideMenu ${isMobile ? "mobileSM" : ""} ${showSideMenu ? "open" : ""}`}
            ref={sideMenuRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => {
                contextGesture.current = false;
                horizontalSwipe.current = false;
                verticalScroll.current = false;
                setIsDragging(false);
                setDontHandle(false);
                if (!menu.visible) setTranslateX(showSideMenu ? 0 : -100);
            }}
            style={{
                transform: isMobile || layout === "hidden" || studio ? `translateX(${translateX}%)` : "none",
                pointerEvents: (isMobile || layout === "hidden" || studio) && !showSideMenu ? "none" : undefined
            }}
        >
            <div className="ListWrapper">
                <div
                    className="slider"
                    style={{
                        transform: `translateX(${translateSlider}%)`,
                        transition: startupTabAnimationReady ? undefined : "none"
                    }}
                >
                    <div className="slide">
                        {loadingUser || (loadingList && (list.length === 0 || contactSearch.trim().length > 0)) ? <Skeleton type="list" /> : <ContactsList filter={messageSelectedValue} searchRef={mainSearchRef} />}
                    </div>
                    <div className="slide">
                        {loadingUser || loadingHabits && !habits?.length ? <Skeleton type="list" /> : <HabitsList filter={habitsSelectedValue} />}
                    </div>
                    <div className="slide">
                        {loadingUser ? <Skeleton type="list" /> : <SpotsList />}
                    </div>
                    <div className="slide">
                        {loadingUser ? <Skeleton type="list" /> : <AccountList />}
                    </div>
                </div>
            </div>
        </div>
    );
}
