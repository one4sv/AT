import { useUser } from "../../hooks/UserHook"
import { CircleUserRound, Megaphone } from "lucide-react"
import { CalendarCheckIcon, ChatTeardropIcon } from "@phosphor-icons/react"
import { useSideMenu } from "../../hooks/SideMenuHook"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useContacts } from "../../hooks/ContactsHook"
import { useSettings } from "../../hooks/SettingsHook"
import { useHabits } from "../../hooks/HabitsHook"
import { filterHabitsByOrder } from "../utils/filteredHabitsByOrder"

export default function SMnav() {
    const { t, i18n } = useTranslation("common")
    const { user } = useUser()
    const { setActiveTab, activeTab, messageSelectedValue, setMessageSelectedValue, habitsSelectedValue, setHabitsSelectedValue } = useSideMenu()
    const { list } = useContacts()
    const { habits, newOrderHabits } = useHabits()
    const { showArchived } = useSettings()

    const [filterType, setFilterType] = useState<"chats" | "habits" | "spots">("chats")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [chatsFilters, setMessagesFilters] = useState<{label: string, value: string, new: string}[]>([])
    const [habitsFilters, setHabitsFilters] = useState<{label: string, value: string, new: string}[]>([])
    const translateSelector =
        activeTab === "chats" ? 0 :
        activeTab === "habits" ? 25 :
        activeTab === "spots" ? 50 :
        activeTab === "user" ? 75 :
        0;
    const timerRef = useRef<number | null>(null)
    // const longPressTriggered = useRef(false)
    const tabsRef = useRef<HTMLDivElement>(null)
    const filtersRef = useRef<HTMLDivElement>(null)
    
    const newLength = list.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length
    
    useEffect(() => {
        const filters: {label: string, value: string, new: string}[] = []
        
        const totalNew = newLength > 99 ? "99+" : newLength > 0 ? String(newLength) : ""
        filters.push({ label: "Чаты", value: "chats", new: totalNew })

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
            setMessageSelectedValue(filters[0]?.value ?? "chats")
        }
    }, [list, newLength, t, i18n.language])

        useEffect(() => {
        const filters: { label: string; value: string, new: string }[] = []
        filters.push({ label: "Актив", value: "all", new: "0" })

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

    // const startLongPress = (openFn: () => void) => {
    //     longPressTriggered.current = false
    //     if (timerRef.current) clearTimeout(timerRef.current)
    //     timerRef.current = window.setTimeout(() => {
    //         longPressTriggered.current = true
    //         openFn()
    //     }, 350)
    // }

    const cancelLongPress = () => {
        setFilterType("chats")
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

    const messageSelected = chatsFilters.find(f => f.value === messageSelectedValue) 
        ?? { label: "Чаты", value: "chats", new: "" }
    
    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue) 
        ?? { label: "Актив", value: "all", new: "0" }

    return (
        <div className="SMnavDiv">
            <div className={`SMfiltersDiv ${isFilterOpen ? "open" : ""} ${filterType || ""}`} ref={filtersRef}>
                {(filterType === "chats" ? chatsFilters : habitsFilters).map(filter => (
                    <div 
                        className={`filterItem ${
                            (filterType === "chats" ? messageSelectedValue : habitsSelectedValue) === filter.value 
                                ? "selected" 
                                : ""
                        }`} 
                        key={filter.value}
                        onMouseUp={() => {
                            if (filterType === "chats") {
                                setMessageSelectedValue(filter.value)
                                setActiveTab("chats")
                            }
                            if (filterType === "habits") {
                                setHabitsSelectedValue(filter.value)
                                setActiveTab("habits")
                            }
                            setIsFilterOpen(false)
                        }}
                        onTouchEnd={() => {
                            if (filterType === "chats") {
                                setMessageSelectedValue(filter.value)
                                setActiveTab("chats")
                            }
                            if (filterType === "habits") {
                                setHabitsSelectedValue(filter.value)
                                setActiveTab("habits")
                            }
                            setIsFilterOpen(false)
                        }}
                    >
                        {filter.label}
                        {filterType === "chats" && filter.new && <span className="new">{` ${filter.new}`}</span>}
                    </div>
                ))}
            </div>
            <div className="SMnav">
                <div className="SMnavActive"
                    style={{left:`${translateSelector}%`}}
                />             
                <div className={`SMnavButt ${activeTab === "chats" ? "active" : ""}`} onClick={() => setActiveTab("chats")}>
                    <ChatTeardropIcon weight="fill"/>
                    <span>{messageSelected.label}</span>
                </div>
                <div className={`SMnavButt ${activeTab === "habits" ? "active" : ""}`} onClick={() => setActiveTab("habits")
                }>
                    <CalendarCheckIcon weight="fill"/>
                    <span>{habitsSelected.label}</span>
                </div>
                <div className={`SMnavButt ${activeTab === "spots" ? "active" : ""}`} onClick={() => setActiveTab("spots")}>
                    <Megaphone fill="currentColor"/>
                    <span>Споты</span>
                </div>   
                <div
                    className={`SMnavButt SMnavAvatar ${activeTab === "user" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("user")
                    }}
                >
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.username ?? user.nick ?? "фото"}
                        />
                    ) : (
                        <CircleUserRound />
                    )}
                    <span>{user.nick}</span>
                </div>
            </div>
        </div>
    )
}