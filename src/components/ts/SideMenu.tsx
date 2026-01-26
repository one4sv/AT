import { useState, useRef, useEffect } from "react"
import axios, { isAxiosError } from "axios"
import "../../scss/SM/sideMenu.scss"
import { CircleUserRound, Search, LogOut, House, ChartLine, Plus } from "lucide-react"
import HabitsList from "./SM/HabitsList.tsx"
import { useUser } from "../hooks/UserHook"
import { useNote } from "../hooks/NoteHook"
import { useBlackout } from "../hooks/BlackoutHook.ts"
import ContactsList from "./SM/ContactsList.tsx"
import { useNavigate } from "react-router"
import { useSettings } from "../hooks/SettingsHook.ts"
import { useChat } from "../hooks/ChatHook.ts"
import { useHabits } from "../hooks/HabitsHook.ts"
import MinLoader from "./MinLoader.tsx"
import { useLocation } from "react-router"
import { isMobile } from "react-device-detect"
import { SortAscending } from "@phosphor-icons/react"
import { filterHabitsByOrder } from "./utils/filteredHabitsByOrder.tsx"

export default function SideMenu() {
    const { setSearch, loadingList, list } = useChat()
    const { loadingHabits, habits, newOrderHabits } = useHabits()
    const { user, refetchUser } = useUser()
    const { setTab, showArchived } = useSettings()
    const { setBlackout } = useBlackout()
    const { showNotification } = useNote()
    const API_URL = import.meta.env.VITE_API_URL
    const location = useLocation()
    const navigate = useNavigate()

    const [filterType, setFilterType] = useState<"messages" | "habits">("messages")
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const [showList, setShowList] = useState(false)
    const [activeTab, setActiveTab] = useState<string>("messages")
    const [showPlusMenu, setShowPlusMenu] = useState<boolean>(false)
    
    const [messagesFilters, setMessagesFilters] = useState<{label: string, value: string, new: string}[]>([])
    const [habitsFilters, setHabitsFilters] = useState<{label: string, value: string, new: string}[]>([])
    const [messageSelected, setMessageSelected] = useState<{label: string, value: string, new: string}>({ label: "Сообщения", value: "all", new: "0" })
    const [habitsSelected, setHabitsSelected] = useState<{label: string, value: string, new: string}>({label: "Активности", value: "all", new:"0"})

    const tabsRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const plusRef = useRef<HTMLDivElement>(null)
    const plusMenuRef = useRef<HTMLDivElement>(null)
    const filtersRef = useRef<HTMLDivElement>(null)

    // --- long press refs/state ---
    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)

    const newLength = list.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length

    useEffect(() => {
        if (location.pathname.includes("/habit")) setActiveTab("habits")
    }, [location.pathname])

    // --- message filters ---
    useEffect(() => {
        const filters: {label: string, value: string, new: string}[] = []
        
        const totalNew = newLength > 99 ? "99+" : newLength > 0 ? String(newLength) : ""
        filters.push({ label: "Сообщения", value: "all", new: totalNew })
        setMessageSelected({ label: "Сообщения", value: "all", new: totalNew })

        if (newLength > 0) {
            filters.push({ label: "Новые", value: "new", new: totalNew })
        }

        const privateChats = list.filter(c => !c.is_group)
        if (privateChats.length > 0) {
            const privateNewCount = privateChats.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length
            const privateNew = privateNewCount > 99 ? "99+" : privateNewCount > 0 ? String(privateNewCount) : ""
            filters.push({ label: "Личные", value: "private", new: privateNew })
        }

        const groupChats = list.filter(c => c.is_group)
        if (groupChats.length > 0) {
            const groupNewCount = groupChats.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length
            const groupNew = groupNewCount > 99 ? "99+" : groupNewCount > 0 ? String(groupNewCount) : ""
            filters.push({ label: "Беседы", value: "group", new: groupNew })
        }

        setMessagesFilters(filters)
        
        if (!filters.some(f => f.value === messageSelected.value)) {
            setMessageSelected(filters[0] ?? { label: "Все", value: "all", new: "" })
        }
    }, [list, newLength])

    // --- habits filters ---
    useEffect(() => {
        const filters: { label: string; value: string, new: string }[] = []
        filters.push({ label: "Активности", value: "all", new:"0" })

        if (newOrderHabits && habits) {
            const groupLabels: Record<string, string> = {
                everyday: "Ежедневные",
                today: "Сегодня",
                tomorrow: "Завтра",
                sometimes: "Иногда",
            }

            const activeHabits = habits.filter(h => !h.is_archived)

            newOrderHabits.forEach(order => {
                if (order === "pinned") return

                const groupHabits = filterHabitsByOrder(order, activeHabits, "")
                if (groupHabits.length > 0) {
                    let label = groupLabels[order]
                    if (!label) {
                        const date = new Date(order)
                        if (!isNaN(date.getTime())) {
                            label = date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })
                        } else {
                            return
                        }
                    }
                    filters.push({ label, value: order, new:"0" })
                }
            })

            const hasArchived = habits.some(h => h.is_archived)
            if (hasArchived) {
                filters.push({ label: "Архив", value: "archived", new:"0" })
            }
        }

        setHabitsFilters(filters)
        if (!filters.some(f => f.value === habitsSelected.value)) {
            setHabitsSelected(filters[0])
        }
    }, [habits, newOrderHabits, showArchived])

    const logOut = async () => {
        try {
            const res = await axios.get(`${API_URL}logout`, { withCredentials: true })
            if (res.data.success) {
                refetchUser()
            } else {
                showNotification("error", "Не удалось выйти")
            }
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                showNotification("error", error.response?.data?.messages || "Ошибка при выходе")
            } else {
                showNotification("error", "Что-то пошло не так")
            }
        }
    }

    // Закрытие меню профиля
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

    // Закрытие плюс-меню
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

    // Закрытие фильтров при клике вне
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

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

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
            if (
                tabsRef.current &&
                !tabsRef.current.contains(event.target as Node)
            ) setIsFilterOpen(false)
        }

        document.addEventListener("mouseup", handleUp)
        document.addEventListener("touchend", handleUp)

        return () => {
            document.removeEventListener("mouseup", handleUp)
            document.removeEventListener("touchend", handleUp)
        }
    }, [])

    console.log(filterType, isFilterOpen)
    return (
        <div className={`sideMenu ${isMobile ? "mobileSM" : ""}`}>
            <div className="SMsearchDiv">
                <div className="SMmenuWrapper">
                    <div
                        className={`SMmenuButt ${showList ? "active" : ""}`}
                        onClick={() => setShowList(!showList)}
                        ref={buttonRef}
                    >
                        {user?.avatar_url ? <img className="SMmenuAvatar" src={user.avatar_url} alt={(user.username ?? user.nick) || undefined} /> : <CircleUserRound />}
                    </div>
                    <div className={`SMprofileMenu ${showList ? "active" : ""} ${isMobile ? "mobile" : ""}`} ref={menuRef}>
                        <div className="SMprofileButt" onClick={() => {
                            setShowList(false)
                            navigate(`/acc/${user.nick}`)
                        }}>
                            {user.username || user.nick}
                        </div>
                        <div
                            className="SMprofileButt"
                            onClick={() => {
                                setShowList(false)
                                setTab("pers")
                                setBlackout({ seted: true, module: "Settings" })
                            }}
                        >
                            Настройки
                        </div>
                        <div className="SMprofileButt exit" onClick={logOut}>
                            Выйти <LogOut />
                        </div>
                    </div>
                </div>
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" onChange={(e) => setSearch(e.currentTarget.value)} placeholder="Поиск..." />
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
                            if (!isFilterOpen) {
                                setIsFilterOpen(true)
                            } else {
                                setIsFilterOpen(false)
                            }
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
                            if (!isFilterOpen) {
                                setIsFilterOpen(true)
                            } else {
                                setIsFilterOpen(false)
                            }
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
                    <div className={`filterItem ${
                            messageSelected.value === filter.value ? "selected" : ""
                        }`} key={filter.value}
                        onMouseUp={() => {
                            setActiveTab(filterType!)
                            if (filterType === "messages") {
                                setMessageSelected(filter)
                                setActiveTab("messages")
                            }

                            if (filterType === "habits") {
                                setHabitsSelected(filter)
                                setActiveTab("habits")
                            }

                            setIsFilterOpen(false)
                        }}
                        onTouchEnd={() => {
                            setActiveTab(filterType!)
                            if (filterType === "messages") {
                                setMessageSelected(filter)
                                setActiveTab("messages")
                            }
                            if (filterType === "habits") {
                                setHabitsSelected(filter)
                                setActiveTab("habits")
                            }
                            setIsFilterOpen(false)
                        }}
                    >
                        {filter.label}
                        {filterType === "messages" && <span className="new">{filter.new}</span>}
                    </div>
                ))}
            </div>

            <div className="ListWrapper">
                <div className="slider" style={{ transform: `translateX(${activeTab === "messages" ? 0 : -50}%)` }}>
                    <div className={`slide ${isMobile ? "mobileSlide" : ""}`}>
                        {loadingList ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <ContactsList filter={messageSelected.value} />
                        )}
                    </div>
                    <div className={`slide ${isMobile ? "mobileSlide" : ""}`}>
                        {loadingHabits ? (
                            <div className="menuLoader"><MinLoader /></div>
                        ) : (
                            <HabitsList filter={habitsSelected.value} />
                        )}
                    </div>
                </div>
            </div>

            <div className="SMnavDiv">
                <div className={`plusMenu ${showPlusMenu ? "active" : ""}`} ref={plusMenuRef}>
                    <div className="plusMenuButt" onClick={() => setBlackout({seted:true, module:"AddHabit"})}>
                        Добавить активность
                    </div>
                    <div className="plusMenuButt" onClick={() => setBlackout({seted:true, module:"CreateChat"})}>
                        Создать чат
                    </div>
                </div>
                <div className="SMnav">
                    <div className="SMnavButt" onClick={() => navigate("/")}>
                        <House />
                    </div>
                    <div className="SMnavButt" onClick={()=> setShowPlusMenu(!showPlusMenu)} ref={plusRef}>
                        <Plus />
                    </div>
                    <div className="SMnavButt" onClick={() => navigate("/habit")}>
                        <ChartLine />
                    </div>
                </div>
            </div>
        </div>
    )
}
