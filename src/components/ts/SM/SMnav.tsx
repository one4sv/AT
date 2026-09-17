import { useUser } from "../../hooks/UserHook"
import { CircleUserRound, Megaphone } from "lucide-react"
import { CalendarCheckIcon, ChatTeardropIcon, GearIcon, PlusIcon, SignOutIcon, SortAscendingIcon, UserIcon } from "@phosphor-icons/react"
import { useSideMenu } from "../../hooks/SideMenuHook"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useContacts } from "../../hooks/ContactsHook"
import { useSettings } from "../../hooks/SettingsHook"
import { useHabits } from "../../hooks/HabitsHook"
import { filterHabitsByOrder } from "../utils/filteredHabitsByOrder"
import type { tab } from "../../context/SideMenuContext"
import { useBlackout } from "../../hooks/BlackoutHook"
import { useNote } from "../../hooks/NoteHook"
import { useNavigate } from "react-router"

export default function SMnav() {
    const { t, i18n } = useTranslation("common")
    const { user } = useUser()
    const { setActiveTab, activeTab, messageSelectedValue, setMessageSelectedValue, habitsSelectedValue, setHabitsSelectedValue, setDontHandle, setDontHandleOther  } = useSideMenu()
    const { setBlackout } = useBlackout()
    const { list } = useContacts()
    const { habits, newOrderHabits } = useHabits()
    const { showArchived } = useSettings()
    const { showNotification } = useNote()

    const navigate = useNavigate()

    const [extraMenu, setExtraMenu] = useState<tab>()
    const [isExtraOpen, setIsExtraOpen] = useState(false)
    const [chatsFilters, setMessagesFilters] = useState<{label: string, value: string, new: string}[]>([])
    const [habitsFilters, setHabitsFilters] = useState<{label: string, value: string, new: string}[]>([])

    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
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
            const target = event.target as Node

            if (
                filtersRef.current?.contains(target) ||
                tabsRef.current?.contains(target)
            ) {
                return
            }

            setIsExtraOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const startLongPress = (tab:tab) => {
        longPressTriggered.current = false
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            longPressTriggered.current = true
            setDontHandle(true)
            setDontHandleOther(true)
            setExtraMenu(tab)
            setIsExtraOpen(true)
        }, 350)
    }

    const cancelLongPress = () => {
        if (timerRef.current) {
            longPressTriggered.current = false
            clearTimeout(timerRef.current)
            timerRef.current = null
            setDontHandle(false)
            setDontHandleOther(false)
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

    console.log(longPressTriggered.current)
    
    const handleNavEnter = (tab: tab) => {
        if (longPressTriggered.current) {
            setExtraMenu(tab)
            setIsExtraOpen(true)
        }
    }

    const messageSelected = chatsFilters.find(f => f.value === messageSelectedValue) 
        ?? { label: "Чаты", value: "chats", new: "" }
    
    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue) 
        ?? { label: "Актив", value: "all", new: "0" }

    const navFunc = (tab: tab) => {
        if (tab !== activeTab) {
            setExtraMenu(tab)
            setActiveTab(tab)
        } else {
            setExtraMenu(tab)
            setIsExtraOpen(!isExtraOpen)
        }
    }

    const extraButts = () => {
        switch (extraMenu) {
            case "chats":
                return (
                    <div className="SMextraMenuButt"
                        onMouseUp={() => {
                            setBlackout({seted:true, module:"CreateChat"})
                            setIsExtraOpen(false)
                        }}
                        onTouchEnd={() => {
                            setBlackout({seted:true, module:"CreateChat"})
                            setIsExtraOpen(false)
                        }}
                    >
                        <PlusIcon size={20}/> Новая беседа
                    </div>
                )            
            case "habits":
                return (
                    <div className="SMextraMenuButt"
                        onMouseUp={() => {
                            setBlackout({seted:true, module:"AddHabit"})
                            setIsExtraOpen(false)
                        }}
                        onTouchEnd={() => {
                            setBlackout({seted:true, module:"AddHabit"})
                            setIsExtraOpen(false)
                        }}
                    >
                        <PlusIcon size={20}/> Новая активность
                    </div>
                )            
            case "spots":
                return (
                    <div className="SMextraMenuButt"
                        onMouseUp={() => {
                            showNotification("info", "В разработке")
                            setIsExtraOpen(false)
                        }}
                        onTouchEnd={() => {
                            showNotification("info", "В разработке")
                            setIsExtraOpen(false)
                        }}
                    >
                        <PlusIcon size={20}/> Новый спот
                    </div>
                )            
            case "user":
                return (
                    <>
                        <div className="SMextraMenuButt user"
                            onMouseUp={() => {
                                navigate(`/acc/${user.nick}`)
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={() => {
                                navigate(`/acc/${user.nick}`)
                                setIsExtraOpen(false)
                            }}
                        >
                            <UserIcon weight="fill" size={20}/> В профиль
                        </div>                        
                        <div className="SMextraMenuButt user"
                            onMouseUp={() => {
                                navigate(`/settings`)
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={() => {
                                navigate(`/settings`)
                                setIsExtraOpen(false)
                            }}
                        >
                            <GearIcon weight="fill" size={20}/> Настройки
                        </div>                            
                        <div className="SMextraMenuButt logout user"
                            onMouseUp={() => {
                                showNotification("info", "В разработке")
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={() => {
                                showNotification("info", "В разработке")
                                setIsExtraOpen(false)
                            }}
                        >
                            <SignOutIcon weight="fill" size={20}/> Выйти
                        </div>
                    </>
                )
        }
    }

    return (
        <div className="SMnavDiv">
            <div className={`SMnavExtraDiv ${isExtraOpen ? "open" : ""} ${extraMenu || ""}`} ref={filtersRef}>
                    {extraButts()}
                    {extraMenu === "chats" || extraMenu === "habits" ? <span className="SMextraSeparator"/> : ""}
                    {(extraMenu === "chats" || extraMenu === "habits") && (extraMenu === "chats" ? chatsFilters : habitsFilters).map(filter => (
                        <div 
                            className={`filterItem ${
                                (extraMenu === "chats" ? messageSelectedValue : habitsSelectedValue) === filter.value 
                                    ? "selected" 
                                    : ""
                            }`} 
                            key={filter.value}
                            onMouseUp={() => {
                                if (extraMenu === "chats") {
                                    setMessageSelectedValue(filter.value)
                                    setActiveTab("chats")
                                }
                                if (extraMenu === "habits") {
                                    setHabitsSelectedValue(filter.value)
                                    setActiveTab("habits")
                                }
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={() => {
                                if (extraMenu === "chats") {
                                    setMessageSelectedValue(filter.value)
                                    setActiveTab("chats")
                                }
                                if (extraMenu === "habits") {
                                    setHabitsSelectedValue(filter.value)
                                    setActiveTab("habits")
                                }
                                setIsExtraOpen(false)
                            }}
                        >
                            <SortAscendingIcon/>
                            {filter.label}
                            {extraMenu === "chats" && filter.new && <span className="new">{` ${filter.new}`}</span>}
                        </div>
                    ))}
                </div>
            <div className="SMnav" ref={tabsRef}>
                <div className={`SMnavActive ${activeTab}`}/>             
                <div className={`SMnavButt ${activeTab === "chats" ? "active" : ""}`}
                    onMouseDown={() => startLongPress("chats")}
                    onTouchStart={() => startLongPress("chats")}
                    onMouseUp={() => navFunc("chats")}
                    onMouseEnter={() => handleNavEnter("chats")}
                >
                    <ChatTeardropIcon weight="fill"/>
                    <span>{messageSelected.label}</span>
                </div>
                <div className={`SMnavButt ${activeTab === "habits" ? "active" : ""}`} 
                    onMouseDown={() => startLongPress("habits")}
                    onTouchStart={() => startLongPress("habits")}
                    onMouseUp={() => navFunc("habits")}
                    onMouseEnter={() => handleNavEnter("habits")}
                >
                    <CalendarCheckIcon weight="fill"/>
                    <span>{habitsSelected.label}</span>
                </div>
                <div className={`SMnavButt ${activeTab === "spots" ? "active" : ""}`}
                    onMouseDown={() => startLongPress("spots")}
                    onTouchStart={() => startLongPress("spots")}
                    onMouseUp={() => navFunc("spots")}
                    onMouseEnter={() => handleNavEnter("spots")}
                >
                    <Megaphone fill="currentColor"/>
                    <span>Споты</span>
                </div>   
                <div
                    className={`SMnavButt SMnavAvatar ${activeTab === "user" ? "active" : ""}`}
                    onMouseDown={() => startLongPress("user")}
                    onTouchStart={() => startLongPress("user")}
                    onMouseUp={() => navFunc("user")}
                    onMouseEnter={() => handleNavEnter("user")}
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