import { useRef, useEffect } from "react";
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
import { useContacts } from "../../hooks/ContactsHook.ts";
import AccountList from "./AccountList.tsx";
import SpotsList from "./SpotsList.tsx";
export default function SideMenu() {
    const isMobile = useCompactLayout();
    const {
        user,
        isAuthenticated,
        loadingUser
    } = useUser();
    const {
        list,
        loadingList,
        mainSearchRef
    } = useContacts();
    const {
        habits,
        loadingHabits
    } = useHabits();
    const { refreshSchedules } = useSchedule();
    const { layout } = useSettings();
    const {
        closeMenu,
        activeTab,
        showSideMenu,
        setIsDragging,
        translateX,
        setTranslateX,
        messageSelectedValue,
        habitsSelectedValue,
        setDontHandle
    } = useSideMenu();
    const translateSlider = activeTab === "chats" ? 0 : activeTab === "habits" ? -25 : activeTab === "spots" ? -50 : activeTab === "user" ? -75 : 0;
    const startX = useRef(0);
    const startY = useRef(0);
    const startTranslate = useRef(0);
    const horizontalSwipe = useRef(false);
    const verticalScroll = useRef(false);
    const sideMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user.id) refreshSchedules();
    }, [user.id, refreshSchedules]);
    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        startTranslate.current = translateX;
        horizontalSwipe.current = false;
        verticalScroll.current = false;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const diffPx = clientX - startX.current;
        const diffPy = clientY - startY.current;
        if (!horizontalSwipe.current && !verticalScroll.current) {
            if (Math.abs(diffPy) > 5 || Math.abs(diffPx) > 5) {
                if (Math.abs(diffPy) > Math.abs(diffPx)) {
                    verticalScroll.current = true;
                    setDontHandle(true);
                    return;
                }
                horizontalSwipe.current = true;
                setIsDragging(true);
                setDontHandle(false);
            }
        }
        if (!horizontalSwipe.current) return;
        const diffPercent = diffPx / window.innerWidth * 100;
        let newTranslate = startTranslate.current + diffPercent;
        newTranslate = Math.max(-100, Math.min(0, newTranslate));
        setTranslateX(newTranslate);
    };
    const handleTouchEnd = () => {
        if (!horizontalSwipe.current) {
            setDontHandle(false);
            verticalScroll.current = false;
            horizontalSwipe.current = false;
            return;
        }
        setIsDragging(false);
        setDontHandle(false);
        const target = translateX < -40 ? -100 : 0;
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
                closeMenu();
            }
        };
        requestAnimationFrame(animate);
        horizontalSwipe.current = false;
        verticalScroll.current = false;
    };

    useEffect(
        () => {
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                if (layout !== "hidden" || !showSideMenu) return;
                if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
                    closeMenu();
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("touchstart", handleClickOutside);
            };
        },
        [layout, showSideMenu, closeMenu]
    );
    if (!isAuthenticated && !loadingUser) {
        return <SideMenuUnAunthificated
            ref={sideMenuRef}
            onTouchS={handleTouchStart}
            onTouchM={handleTouchMove}
            onTouchE={handleTouchEnd}
            translateX={translateX}
            onTouchCancel={() => {
                horizontalSwipe.current = false;
                verticalScroll.current = false;
                setIsDragging(false);
                setDontHandle(false);
                setTranslateX(showSideMenu ? 0 : -100);
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
                horizontalSwipe.current = false;
                verticalScroll.current = false;
                setIsDragging(false);
                setDontHandle(false);
                setTranslateX(showSideMenu ? 0 : -100);
            }}
            style={{
                transform: isMobile || layout === "hidden" ? `translateX(${translateX}%)` : "none"
            }}
        >
            <div className="ListWrapper">
                <div
                    className="slider"
                    style={{
                        transform: `translateX(${translateSlider}%)`
                    }}
                >
                    <div className="slide">
                        {loadingUser || loadingList && list.length === 0 ? <Skeleton type="list" /> : <ContactsList filter={messageSelectedValue} searchRef={mainSearchRef} />}
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
