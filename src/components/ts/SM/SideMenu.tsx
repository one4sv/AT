import { useRef, useEffect } from "react";
import { searchTabForFilter } from "../utils/globalSearchQuery";
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
import { useBlackout } from "../../hooks/BlackoutHook.ts";
import { useContextMenu } from "../../hooks/ContextMenuHook.ts";
import { useContacts } from "../../hooks/ContactsHook.ts";
import AccountList from "./AccountList.tsx";
import SpotsList from "./SpotsList.tsx";
import SMGlobalSearch from "./SMGlobalSearch";

const sideMenuTabs = ["chats", "habits", "spots", "user"] as const;

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
    const { layout, sideMenuSwipe } = useSettings();
    const { blackout } = useBlackout();
    const { menu } = useContextMenu();
    const {
        closeMenu,
        openSideMenu,
        activeTab,
        searchMode,
        setSearchMode,
        searchQuery,
        setSearchQuery,
        searchFilter,
        setSearchFilter,
        setActiveTab,
        startupTabAnimationReady,
        showSideMenu,
        setIsDragging,
        translateX,
        setTranslateX,
        messageSelectedValue,
        habitsSelectedValue,
        setDontHandle,
        setDontHandleOther,
        dontHandleOther,
        dontHandle
    } = useSideMenu();
    const searchResults = searchMode ? <SMGlobalSearch key={activeTab} tab={activeTab} query={searchQuery}
        filter={searchFilter}
        onFilterChange={filter => {
            setSearchFilter(filter);
            if (searchQuery.trim().startsWith("/")) setSearchQuery("");
            if (filter) setActiveTab(searchTabForFilter(filter));
        }}
        onChoose={() => { setSearchMode(false); setSearchQuery(""); setSearchFilter(null); closeMenu(); }}/> : null;
    const translateSlider = activeTab === "chats" ? 0 : activeTab === "habits" ? -25 : activeTab === "spots" ? -50 : activeTab === "user" ? -75 : 0;
    const startX = useRef(0);
    const startY = useRef(0);
    const startTranslate = useRef(0);
    const currentTranslate = useRef(0);
    const horizontalSwipe = useRef(false);
    const verticalScroll = useRef(false);
    const contextGesture = useRef(false);
    const swipeDistance = useRef(0);
    const startedOnNav = useRef(false);
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

    const blockGesture = () => {
        contextGesture.current = true;
        if (!horizontalSwipe.current && !verticalScroll.current) return;
        horizontalSwipe.current = false;
        verticalScroll.current = false;
        setIsDragging(false);
        setDontHandle(false);
        setDontHandleOther(false);
        setTranslateX(showSideMenu ? 0 : -100);
    };

    const handleTouchStart = (e: React.TouchEvent | TouchEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        contextGesture.current = studio && !isMobile || menu.visible || blackout.seted || dontHandle || dontHandleOther ||
            e.touches.length !== 1 || !isMobile && !!target?.closest("[data-context-menu]") ||
            !!target?.closest(
                "input, textarea, select, [contenteditable=true], [data-header-gesture], .selector, .ContextMenuWrapper, .blackout, .smHeader.filtersOpen, .SMnavDiv:has(.SMnavExtraDiv.open)"
            );
        if (contextGesture.current) {
            blockGesture();
            return;
        }
        startedOnNav.current = !!target?.closest(".SMnavDiv");
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTranslate.current = translateX;
        currentTranslate.current = translateX;
        swipeDistance.current = 0;
        horizontalSwipe.current = false;
        verticalScroll.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
        if (menu.visible || blackout.seted || e.touches.length !== 1) blockGesture();
        if (contextGesture.current || dontHandleOther && !horizontalSwipe.current) return;

        const diffPx = e.touches[0].clientX - startX.current;
        const diffPy = e.touches[0].clientY - startY.current;
        if (!horizontalSwipe.current && !verticalScroll.current) {
            if (Math.abs(diffPx) < 8 && Math.abs(diffPy) < 8) return;
            if (Math.abs(diffPy) >= Math.abs(diffPx)) {
                verticalScroll.current = true;
                setDontHandle(true);
                return;
            }
            horizontalSwipe.current = true;
            setIsDragging(true);
            setDontHandleOther(true);
            setDontHandle(false);
        }
        if (!horizontalSwipe.current) return;
        if (isMobile && e.cancelable) e.preventDefault();

        swipeDistance.current = diffPx;
        const switching = isMobile && user.id && sideMenuSwipe === "sections" &&
            (activeTab !== "user" || diffPx >= 0);
        const diffPercent = diffPx / window.innerWidth * 100;
        currentTranslate.current = switching ? startTranslate.current :
            Math.max(-100, Math.min(0, startTranslate.current + diffPercent));
        setTranslateX(currentTranslate.current);
    };

    const finishTouch = (cancelled: boolean) => {
        if (horizontalSwipe.current || verticalScroll.current) setDontHandle(false);
        if (horizontalSwipe.current) {
            setIsDragging(false);
            setDontHandleOther(false);
            if (cancelled || menu.visible || blackout.seted) {
                setTranslateX(showSideMenu ? 0 : -100);
            } else {
                const distance = swipeDistance.current;
                if (isMobile && user.id && sideMenuSwipe === "sections" && Math.abs(distance) >= 40) {
                    const index = sideMenuTabs.indexOf(activeTab);
                    const next = sideMenuTabs[index + (distance < 0 ? 1 : -1)];
                    if (next) {
                        if (searchMode) {
                            setSearchFilter(null);
                            if (searchQuery.trim().startsWith("/")) setSearchQuery("");
                        }
                        setActiveTab(next);
                    } else if (activeTab === "user" && distance < 0) {
                        closeMenu();
                    }
                } else if (isMobile && user.id && sideMenuSwipe === "sections") {
                    openSideMenu();
                } else if (currentTranslate.current < (startedOnNav.current ? -40 : -18)) {
                    closeMenu();
                } else {
                    openSideMenu();
                }
            }
        }
        contextGesture.current = false;
        horizontalSwipe.current = false;
        verticalScroll.current = false;
    };

    const touchHandlers = useRef({ handleTouchStart, handleTouchMove, finishTouch, blockGesture, showSideMenu });
    touchHandlers.current = { handleTouchStart, handleTouchMove, finishTouch, blockGesture, showSideMenu };

    useEffect(() => {
        if (!isMobile) return;
        const layout = sideMenuRef.current?.closest<HTMLElement>(".mobile-layout");
        if (!layout) return;
        let tracking = false;
        let suppressClickUntil = 0;

        const start = (event: TouchEvent) => {
            if (tracking) {
                touchHandlers.current.blockGesture();
                return;
            }
            suppressClickUntil = 0;
            const target = event.target instanceof Element ? event.target : null;
            if (!touchHandlers.current.showSideMenu || !target?.closest(".sideMenu, .smHeader, .SMnavDiv")) return;
            tracking = true;
            touchHandlers.current.handleTouchStart(event);
        };
        const move = (event: TouchEvent) => {
            if (tracking) touchHandlers.current.handleTouchMove(event);
        };
        const end = (event: TouchEvent) => {
            if (!tracking || event.type !== "touchcancel" && event.touches.length) return;
            if (horizontalSwipe.current) suppressClickUntil = performance.now() + 400;
            tracking = false;
            touchHandlers.current.finishTouch(event.type === "touchcancel");
        };
        const contextStart = () => {
            if (tracking) touchHandlers.current.blockGesture();
        };
        const click = (event: Event) => {
            if (event instanceof MouseEvent && event.detail > 0 && performance.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        layout.addEventListener("touchstart", start, true);
        layout.addEventListener("touchmove", move, { capture: true, passive: false });
        layout.addEventListener("touchend", end, true);
        layout.addEventListener("touchcancel", end, true);
        layout.addEventListener("click", click, true);
        window.addEventListener("at-context-gesture-start", contextStart);
        return () => {
            layout.removeEventListener("touchstart", start, true);
            layout.removeEventListener("touchmove", move, true);
            layout.removeEventListener("touchend", end, true);
            layout.removeEventListener("touchcancel", end, true);
            layout.removeEventListener("click", click, true);
            window.removeEventListener("at-context-gesture-start", contextStart);
            if (tracking) touchHandlers.current.finishTouch(true);
        };
    }, [isMobile, isAuthenticated, loadingUser]);

    useEffect(
        () => {
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                if (isMobile || (layout !== "hidden" && !!user.id) || !showSideMenu || menu.visible) return;
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
        [layout, showSideMenu, closeMenu, menu.visible, isMobile, studio, user.id]
    );
    if (!isAuthenticated && !loadingUser) {
        return <SideMenuUnAunthificated
            ref={sideMenuRef}
            onTouchS={event => { if (!isMobile) handleTouchStart(event); }}
            onTouchM={event => { if (!isMobile) handleTouchMove(event); }}
            onTouchE={() => { if (!isMobile) finishTouch(false); }}
            translateX={translateX}
            onTouchCancel={() => { if (!isMobile) finishTouch(true); }}
        />;
    }

    return (
        <div
            className={`sideMenu ${isMobile ? "mobileSM" : ""} ${showSideMenu ? "open" : ""}`}
            ref={sideMenuRef}
            onTouchStart={isMobile ? undefined : handleTouchStart}
            onTouchMove={isMobile ? undefined : handleTouchMove}
            onTouchEnd={isMobile ? undefined : () => finishTouch(false)}
            onTouchCancel={isMobile ? undefined : () => finishTouch(true)}
            style={{
                transform: isMobile || layout === "hidden" || studio || !user.id ? `translateX(${translateX}%)` : "none",
                pointerEvents: (isMobile || layout === "hidden" || studio || !user.id) && !showSideMenu ? "none" : undefined
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
                        {searchMode ? (activeTab === "chats" ? searchResults : null) : loadingUser || (loadingList && (list.length === 0 || contactSearch.trim().length > 0)) ? <Skeleton type="list" /> : <ContactsList filter={messageSelectedValue} searchRef={mainSearchRef} />}
                    </div>
                    <div className="slide">
                        {searchMode ? (activeTab === "habits" ? searchResults : null) : loadingUser || loadingHabits && !habits?.length ? <Skeleton type="list" /> : <HabitsList filter={habitsSelectedValue} />}
                    </div>
                    <div className="slide">
                        {searchMode ? (activeTab === "spots" ? searchResults : null) : loadingUser ? <Skeleton type="list" /> : <SpotsList />}
                    </div>
                    <div className="slide">
                        {searchMode ? (activeTab === "user" ? searchResults : null) : loadingUser ? <Skeleton type="list" /> : <AccountList />}
                    </div>
                </div>
            </div>
        </div>
    );
}
