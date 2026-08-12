import { useState, useRef, useEffect } from "react"
import axios, { isAxiosError } from "axios"
import "../../scss/SM/sideMenu.scss"
import { CircleUserRound, Search, LogOut, House, Plus, Calendar } from "lucide-react"
import HabitsList from "./SM/HabitsList.tsx"
import { useUser } from "../hooks/UserHook"
import { useNote } from "../hooks/NoteHook"
import { useBlackout } from "../hooks/BlackoutHook.ts"
import ContactsList from "./SM/ContactsList.tsx"
import { Link, useNavigate } from "react-router"
import { useSettings } from "../hooks/SettingsHook.ts"
import { useChat } from "../hooks/ChatHook.ts"
import { useHabits } from "../hooks/HabitsHook.ts"
import MinLoader from "./MinLoader.tsx"
import { isMobile } from "react-device-detect"
import { CalendarPlusIcon, ChatsIcon, GearIcon, SortAscending, UserIcon } from "@phosphor-icons/react"
import { filterHabitsByOrder } from "./utils/filteredHabitsByOrder.tsx"
import { useSchedule } from "../hooks/ScheduleHook.ts"
import SideMenuUnAunthificated from "./SideMenuUnAunthificated.tsx"
import { useSideMenu } from "../hooks/SideMenuHook.ts"
import { useTranslation } from "react-i18next"

export default function SideMenu() {
    const { t, i18n } = useTranslation("common")
    const { isAuthenticated, loadingUser } = useUser()
    const { setSearch, loadingList, list, mainSearchRef, search } = useChat()
    const { loadingHabits, habits, newOrderHabits } = useHabits()
    const { refreshSchedules } = useSchedule()
    const { user, refetchUser } = useUser()
    const { setTab, showArchived } = useSettings()
    const { setBlackout } = useBlackout()
    const { showNotification } = useNote()
    const { setShowSideMenu, setActiveTab, activeTab, showSideMenu, setIsDragging, isDragging, translateX, setTranslateX } = useSideMenu()

    const API_URL = import.meta.env.VITE_API_URL
    const navigate = useNavigate()

    const [filterType, setFilterType] = useState<"messages" | "habits">("messages")
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const [showList, setShowList] = useState(false)
    const [showPlusMenu, setShowPlusMenu] = useState<boolean>(false)
    
    // Храним только value, label берём через t()
    const [messageSelectedValue, setMessageSelectedValue] = useState("messages")
    const [habitsSelectedValue, setHabitsSelectedValue] = useState("all")

    const [messagesFilters, setMessagesFilters] = useState<{label: string, value: string, new: string}[]>([])
    const [habitsFilters, setHabitsFilters] = useState<{label: string, value: string, new: string}[]>([])

    const startX = useRef(0);
    const startTranslate = useRef(0);
    const sideMenuRef = useRef<HTMLDivElement>(null);

    const tabsRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const plusRef = useRef<HTMLDivElement>(null)
    const plusMenuRef = useRef<HTMLDivElement>(null)
    const filtersRef = useRef<HTMLDivElement>(null)

    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)

    const newLength = list.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length

    // Текущие выбранные фильтры с актуальным переводом
    const messageSelected = messagesFilters.find(f => f.value === messageSelectedValue) 
        ?? { label: t("sideMenu.messages"), value: "messages", new: "" }
    
    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue) 
        ?? { label: t("sideMenu.activities"), value: "all", new: "0" }
    
    useEffect(() => {
        refreshSchedules()
    }, [])

    useEffect(() => {
        const filters: {label: string, value: string, new: string}[] = []
        
        const totalNew = newLength > 99 ? "99+" : newLength > 0 ? String(newLength) : ""
        filters.push({ label: t("sideMenu.messages"), value: "messages", new: totalNew })

        if (newLength > 0) {
            filters.push({ label: t("sideMenu.new"), value: "new", new: totalNew })
        }

        const privateChats = list.filter(c => !c.is_group)
        if (privateChats.length > 0) {
            const privateNewCount = privateChats.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length
            const privateNew = privateNewCount > 99 ? "99+" : privateNewCount > 0 ? String(privateNewCount) : ""
            filters.push({ label: t("sideMenu.private"), value: "private", new: privateNew })
        }

        const groupChats = list.filter(c => c.is_group)
        if (groupChats.length > 0) {
            const groupNewCount = groupChats.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length
            const groupNew = groupNewCount > 99 ? "99+" : groupNewCount > 0 ? String(groupNewCount) : ""
            filters.push({ label: t("sideMenu.groups"), value: "group", new: groupNew })
        }

        setMessagesFilters(filters)
        
        // Если текущий value пропал из списка — сбрасываем
        if (!filters.some(f => f.value === messageSelectedValue)) {
            setMessageSelectedValue(filters[0]?.value ?? "messages")
        }
    }, [list, newLength, t, i18n.language])

    useEffect(() => {
        const filters: { label: string; value: string, new: string }[] = []
        filters.push({ label: t("sideMenu.activities"), value: "all", new: "0" })

        if (newOrderHabits && habits) {
            const groupLabels: Record<string, string> = {
                everyday: t("sideMenu.everyday"),
                today: t("sideMenu.today"),
                tomorrow: t("sideMenu.tomorrow"),
                sometimes: t("sideMenu.sometimes"),
            }

            const activeHabits = habits.filter(h => h.ongoing)

            newOrderHabits.forEach(order => {
                if (order === "pinned") return

                const groupHabits = filterHabitsByOrder(order, activeHabits, "")
                if (groupHabits.length > 0) {
                    let label = groupLabels[order]
                    if (!label) {
                        const date = new Date(order)
                        if (!isNaN(date.getTime())) {
                            label = date.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : undefined, { 
                                weekday: "short", 
                                day: "numeric", 
                                month: "numeric" 
                            })
                        } else {
                            return
                        }
                    }
                    filters.push({ label, value: order, new: "0" })
                }
            })

            const hasArchived = habits.some(h => !h.ongoing)
            if (hasArchived) {
                filters.push({ label: t("sideMenu.archive"), value: "archived", new: "0" })
            }
        }

        setHabitsFilters(filters)
        
        if (!filters.some(f => f.value === habitsSelectedValue)) {
            setHabitsSelectedValue(filters[0]?.value ?? "all")
        }
    }, [habits, newOrderHabits, showArchived, t, i18n.language])

    const logOut = async () => {
        try {
            const res = await axios.get(`${API_URL}logout`, { withCredentials: true })
            if (res.data.success) {
                refetchUser()
            } else {
                showNotification("error", t("sideMenu.logOutError"))
            }
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                showNotification("error", error.response?.data?.messages || t("sideMenu.logOutError"))
            } else {
                showNotification("error", t("sideMenu.logOutErrorGeneric"))
            }
        }
    }

    // ... остальные useEffect для click outside и long press без изменений ...

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setShowList(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                plusRef.current &&
                !plusRef.current.contains(event.target as Node) &&
                plusMenuRef.current &&
                !plusMenuRef.current.contains(event.target as Node)
            ) {
                setShowPlusMenu(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filtersRef.current && 
                !filtersRef.current.contains(event.target as Node) && 
                tabsRef.current && 
                !tabsRef.current.contains(event.target as Node)
            ) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const startLongPress = (openFn: () => void) => {
        longPressTriggered.current = false
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            longPressTriggered.current = true
            openFn()
        }, 350)
    }

    const cancelLongPress = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    useEffect(() => {
        const onUp = () => cancelLongPress()
        document.addEventListener("mouseup", onUp)
        document.addEventListener("touchend", onUp)
        return () => {
            document.removeEventListener("mouseup", onUp)
            document.removeEventListener("touchend", onUp)
        }
    }, [])

    useEffect(() => {
        const handleUp = (event: MouseEvent | TouchEvent) => {
            cancelLongPress()
            if (tabsRef.current && !tabsRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false)
            }
        }
        document.addEventListener("mouseup", handleUp)
        document.addEventListener("touchend", handleUp)
        return () => {
            document.removeEventListener("mouseup", handleUp)
            document.removeEventListener("touchend", handleUp)
        }
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
                transform: isMobile ? `translateX(${translateX}%)` : "none",
                transition: isDragging ? "none" : "transform 0.4s ease"
            }}
        >
            <div className="SMsearchDiv">
                <div className="SMmenuWrapper">
                    <div
                        className={`SMmenuButt ${showList ? "active" : ""}`}
                        onClick={() => setShowList(!showList)}
                        ref={buttonRef}
                    >
                        {user?.avatar_url 
                            ? <img className="SMmenuAvatar" src={user.avatar_url} alt={(user.username ?? user.nick) || undefined} /> 
                            : <CircleUserRound />
                        }
                    </div>
                    <div className={`SMprofileMenu ${showList ? "active" : ""} ${isMobile ? "mobile" : ""}`} ref={menuRef}>
                        <div className="ContextMenuButt" onClick={() => {
                            setShowList(false)
                            navigate(`/acc/${user.nick}`)
                            setShowSideMenu(false)
                        }}>
                            <UserIcon size={20} />
                            {user.username || user.nick}
                        </div>
                        <div
                            className="ContextMenuButt"
                            onClick={() => {
                                setShowList(false)
                                if (!isMobile) setTab("pers")
                                else setTab("menu")
                                navigate('/settings')
                                setShowSideMenu(false)
                            }}
                        >
                            <GearIcon />
                            {t("sideMenu.settings")}
                        </div>
                        <div className="ContextMenuButt delete" onClick={() => {
                            logOut()
                            setShowSideMenu(false)
                        }}>
                            <LogOut />
                            {t("sideMenu.logOut")}
                        </div>
                    </div>
                </div>
                <div className="SMsearch">
                    <input 
                        type="text" 
                        className="SMsearchInput" 
                        ref={mainSearchRef} 
                        onChange={(e) => setSearch(e.currentTarget.value)} 
                        placeholder={t("sideMenu.searchPlaceholder")} 
                        value={search}
                    />
                    <Search />
                </div>
            </div>

            <div className="SMtabs" ref={tabsRef}>
                <div className={`SMtab ${activeTab === "messages" ? "active" : ""}`}
                    onMouseDown={() => startLongPress(() => {
                        setFilterType("messages")
                        setIsFilterOpen(true)
                    })}
                    onTouchStart={() => startLongPress(() => {
                        setFilterType("messages")
                        setIsFilterOpen(true)
                    })}
                    onMouseUp={() => {
                        setFilterType("messages")
                        if (activeTab === "messages") {
                            setIsFilterOpen(prev => !prev)
                        } else {
                            setActiveTab("messages")
                        }
                    }}
                >
                    {activeTab === "messages" && <div className="SMfilter"><SortAscending /></div>}
                    {messageSelected.label}
                    {messageSelected.new !== "" && <span className="newMessagesLength">{messageSelected.new}</span>}
                </div>

                <div className={`SMtab ${activeTab === "habits" ? "active" : ""}`}
                    onMouseDown={() => startLongPress(() => {
                        setFilterType("habits")
                        setIsFilterOpen(true)
                    })}
                    onTouchStart={() => startLongPress(() => {
                        setFilterType("habits")
                        setIsFilterOpen(true)
                    })}
                    onMouseUp={() => {
                        setFilterType("habits")
                        if (activeTab === "habits") {
                            setIsFilterOpen(prev => !prev)
                        } else {
                            setActiveTab("habits")
                        }
                    }}
                >
                    {activeTab === "habits" && <div className="SMfilter"><SortAscending /></div>}
                    {habitsSelected.label}
                </div>
            </div>

            <div className={`SMline ${activeTab === "messages" ? "mess" : "habits"}`} />

            <div className={`SMfiltersDiv ${isFilterOpen ? "open" : ""} ${filterType || ""}`} ref={filtersRef}>
                {(filterType === "messages" ? messagesFilters : habitsFilters).map(filter => (
                    <div 
                        className={`filterItem ${
                            (filterType === "messages" ? messageSelectedValue : habitsSelectedValue) === filter.value 
                                ? "selected" 
                                : ""
                        }`} 
                        key={filter.value}
                        onMouseUp={() => {
                            if (filterType === "messages") {
                                setMessageSelectedValue(filter.value)
                                setActiveTab("messages")
                            }
                            if (filterType === "habits") {
                                setHabitsSelectedValue(filter.value)
                                setActiveTab("habits")
                            }
                            setIsFilterOpen(false)
                        }}
                        onTouchEnd={() => {
                            if (filterType === "messages") {
                                setMessageSelectedValue(filter.value)
                                setActiveTab("messages")
                            }
                            if (filterType === "habits") {
                                setHabitsSelectedValue(filter.value)
                                setActiveTab("habits")
                            }
                            setIsFilterOpen(false)
                        }}
                    >
                        {filter.label}
                        {filterType === "messages" && filter.new && <span className="new">{` ${filter.new}`}</span>}
                    </div>
                ))}
            </div>

            <div className="ListWrapper">
                <div className="slider" style={{ transform: `translateX(${activeTab === "messages" ? 0 : -50}%)` }}>
                    <div className={`slide ${isMobile ? "mobileSlide" : ""}`}>
                        {loadingList ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <ContactsList filter={messageSelectedValue} searchRef={mainSearchRef}/>
                        )}
                    </div>
                    <div className={`slide ${isMobile ? "mobileSlide" : ""}`}>
                        {loadingHabits ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <HabitsList filter={habitsSelectedValue}/>
                        )}
                    </div>
                </div>
            </div>

            <div className="SMnavDiv">
                <div className={`plusMenu ${showPlusMenu ? "active" : ""}`} ref={plusMenuRef}>
                    <div className="plusMenuButt" onClick={() => setBlackout({seted:true, module:"AddHabit"})}>
                        <CalendarPlusIcon weight="fill" size={24}/>{t("sideMenu.addActivity")}
                    </div>
                    <div className="plusMenuButt" onClick={() => setBlackout({seted:true, module:"CreateChat"})}>
                        <ChatsIcon weight="fill" size={24}/>{t("sideMenu.createChat")}
                    </div>
                </div>
                <div className="SMnav">
                    <Link className={`SMnavButt ${location.pathname === "/" ? "active" : ""}`} to={"/"}>
                        <House />
                        {t("sideMenu.home")}
                    </Link>
                    <div className={`SMnavButt ${showPlusMenu ? "active" : ""}`} onClick={() => setShowPlusMenu(!showPlusMenu)} ref={plusRef}>
                        <Plus />
                        {t("sideMenu.add")}
                    </div>
                    <Link className={`SMnavButt ${location.pathname === ("/habit") || location.pathname === ("/habit/") ? "active" : ""}`} to={"/habit"}>
                        <Calendar />
                        {t("sideMenu.activities")}
                    </Link>
                </div>
            </div>
        </div>
    )
}