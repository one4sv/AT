import { useRef, useEffect } from "react"
import "../../../scss/SM/sideMenu.scss"
import HabitsList from "./HabitsList.tsx"
import { useUser } from "../../hooks/UserHook.ts"
import ContactsList from "./ContactsList.tsx"
import { useSettings } from "../../hooks/SettingsHook.ts"
import { useHabits } from "../../hooks/HabitsHook.ts"
import MinLoader from "../MinLoader.tsx"
import { isMobile } from "react-device-detect"
import { useSchedule } from "../../hooks/ScheduleHook.ts"
import SideMenuUnAunthificated from "../SideMenuUnAunthificated.tsx"
import { useSideMenu } from "../../hooks/SideMenuHook.ts"
import { useTranslation } from "react-i18next"
import { useContacts } from "../../hooks/ContactsHook.ts"
import AccountList from "./AccountList.tsx"
import SpotsList from "./SpotsList.tsx"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

export default function SideMenu() {
    const { t } = useTranslation("common")
    const { isAuthenticated, loadingUser } = useUser()
    const { setSearch, loadingList, mainSearchRef, search } = useContacts()
    const { loadingHabits } = useHabits()
    const { refreshSchedules } = useSchedule()
    const { layout } = useSettings()
    const { setShowSideMenu, activeTab, showSideMenu, setIsDragging, isDragging, translateX, setTranslateX, messageSelectedValue, habitsSelectedValue } = useSideMenu()
    
    const translateSlider =
        activeTab === "chats" ? 0 :
        activeTab === "habits" ? -25 :
        activeTab === "spots" ? -50 :
        activeTab === "user" ? -75 :
        0;

    const startX = useRef(0);
    const startTranslate = useRef(0);
    const sideMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        refreshSchedules()
    }, [])

    const closeMenu = () => {
        setTranslateX(-100);
        setTimeout(() => {
            setShowSideMenu(false);
            setTranslateX(-100);
        }, 280);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startTranslate.current = translateX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = e.touches[0].clientX;
        const diffPx = clientX - startX.current;
        const diffPercent = (diffPx / window.innerWidth) * 100;
        let newTranslate = startTranslate.current + diffPercent;
        newTranslate = Math.max(-100, Math.min(0, newTranslate));
        setTranslateX(newTranslate);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = -40;
        if (translateX < threshold) {
            closeMenu();
        } else {
            setTranslateX(0);
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (layout !== "hidden" || !showSideMenu) return;

            if (
                sideMenuRef.current &&
                !sideMenuRef.current.contains(event.target as Node)
            ) {
                closeMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [layout, showSideMenu, translateX]);

    if (!isAuthenticated && !loadingUser) return (
        <SideMenuUnAunthificated 
            ref={sideMenuRef}
            onTouchS={handleTouchStart}
            onTouchM={handleTouchMove}
            onTouchE={handleTouchEnd}
            translateX={translateX}
            isDragging={isDragging}
        />
    )

    return (
        <div className={`sideMenu ${isMobile ? "mobileSM" : ""} ${showSideMenu ? "open" : ""}`} 
            ref={sideMenuRef}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchMove={isMobile ? handleTouchMove : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined} 
            style={{
                transform: isMobile || layout === "hidden" ? `translateX(${translateX}%)` : "none",
                transition: isDragging ? "none" : "transform 0.4s ease"
            }}
        >
            <div className="SMsearchDiv">
                <div className="SMsearch">
                    <input 
                        type="text" 
                        className="SMsearchInput" 
                        ref={mainSearchRef} 
                        onChange={(e) => setSearch(e.currentTarget.value)} 
                        placeholder={t("sideMenu.searchPlaceholder")} 
                        value={search}
                    />
                    <MagnifyingGlassIcon size={22}/>
                </div>
            </div>

            <div className="ListWrapper">
                <div className="slider" style={{ transform: `translateX(${translateSlider}%)` }}>
                    <div className="slide">
                        {loadingList ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <ContactsList filter={messageSelectedValue} searchRef={mainSearchRef}/>
                        )}
                    </div>                  
                    <div className="slide">
                        {loadingHabits ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <HabitsList filter={habitsSelectedValue}/>
                        )}
                    </div>  
                    <div className="slide">
                        {loadingList ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <SpotsList/>
                        )}
                    </div>                    
                    <div className="slide">
                        {loadingList ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <AccountList/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}