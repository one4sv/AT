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
    const {
        setActiveTab,
        activeTab,
        messageSelectedValue,
        setMessageSelectedValue,
        habitsSelectedValue,
        setHabitsSelectedValue,
        setDontHandle,
        setDontHandleOther
    } = useSideMenu()
    const { setBlackout } = useBlackout()
    const { list } = useContacts()
    const { habits, newOrderHabits } = useHabits()
    const { showArchived } = useSettings()
    const { showNotification } = useNote()

    const navigate = useNavigate()

    const [extraMenu, setExtraMenu] = useState<tab>()
    const [isExtraOpen, setIsExtraOpen] = useState(false)
    const [chatsFilters, setMessagesFilters] = useState<{ label: string; value: string; new: string }[]>([])
    const [habitsFilters, setHabitsFilters] = useState<{ label: string; value: string; new: string }[]>([])

    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
    const wasLongPress = useRef(false)
    const isPointerDown = useRef(false)
    const touchStartPos = useRef<{ x: number; y: number } | null>(null)
    const tabsRef = useRef<HTMLDivElement>(null)
    const filtersRef = useRef<HTMLDivElement>(null)

    const newLength = list.filter(c => c.unread_count > 0 && !c.is_blocked && c.note).length

    useEffect(() => {
        const filters: { label: string; value: string; new: string }[] = []

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

        if (!filters.some(f => f.value === messageSelectedValue)) {
            setMessageSelectedValue(filters[0]?.value ?? "chats")
        }
    }, [list, newLength, t, i18n.language])

    useEffect(() => {
        const filters: { label: string; value: string; new: string }[] = []
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

            if (habits.some(h => !h.ongoing)) {
                filters.push({ label: t("sideMenu.archive"), value: "archived", new: "0" })
            }
        }

        setHabitsFilters(filters)

        if (!filters.some(f => f.value === habitsSelectedValue)) {
            setHabitsSelectedValue(filters[0]?.value ?? "all")
        }
    }, [habits, newOrderHabits, showArchived, t, i18n.language])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (isPointerDown.current || wasLongPress.current) return

            const target = event.target as Node
            if (filtersRef.current?.contains(target) || tabsRef.current?.contains(target)) return
            setIsExtraOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("touchstart", handleClickOutside)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [])

    const startLongPress = (tab: tab, clientX?: number, clientY?: number) => {
        isPointerDown.current = true
        longPressTriggered.current = false
        wasLongPress.current = false

        if (timerRef.current) clearTimeout(timerRef.current)

        if (clientX !== undefined && clientY !== undefined) {
            touchStartPos.current = { x: clientX, y: clientY }
        }

        timerRef.current = window.setTimeout(() => {
            longPressTriggered.current = true
            wasLongPress.current = true
            setDontHandle(true)
            setDontHandleOther(true)
            setExtraMenu(tab)
            setIsExtraOpen(true)
        }, 350)
    }

    const cancelLongPress = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        longPressTriggered.current = false
        touchStartPos.current = null
        setDontHandle(false)
        setDontHandleOther(false)
    }

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
        isPointerDown.current = false

        if (!wasLongPress.current) {
            cancelLongPress()
            return
        }

        let clientX: number
        let clientY: number

        if ("changedTouches" in e) {
            clientX = e.changedTouches[0].clientX
            clientY = e.changedTouches[0].clientY
        } else {
            clientX = (e as MouseEvent).clientX
            clientY = (e as MouseEvent).clientY
        }

        const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null
        const extraTarget = element?.closest(".SMextraMenuButt, .filterItem") as HTMLElement | null
        const navTarget = element?.closest(".SMnavButt") as HTMLElement | null

        if (extraTarget) {
            cancelLongPress()
            setTimeout(() => {
                wasLongPress.current = false
            }, 0)
            return
        }

        if (navTarget) {
            const tab = navTarget.dataset.tab as tab | undefined
            if (tab) {
                setActiveTab(tab)
                setExtraMenu(tab)
            }
            setIsExtraOpen(false)
            cancelLongPress()
            setTimeout(() => {
                wasLongPress.current = false
            }, 0)
            return
        }

        setIsExtraOpen(false)
        cancelLongPress()
        setTimeout(() => {
            wasLongPress.current = false
        }, 0)
    }

    useEffect(() => {
        document.addEventListener("mouseup", handlePointerUp)
        document.addEventListener("touchend", handlePointerUp)
        document.addEventListener("touchcancel", handlePointerUp)

        return () => {
            document.removeEventListener("mouseup", handlePointerUp)
            document.removeEventListener("touchend", handlePointerUp)
            document.removeEventListener("touchcancel", handlePointerUp)
        }
    }, [])

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0]

        if (!longPressTriggered.current && touchStartPos.current) {
            const dx = Math.abs(touch.clientX - touchStartPos.current.x)
            const dy = Math.abs(touch.clientY - touchStartPos.current.y)
            if (dx > 12 || dy > 12) {
                cancelLongPress()
                return
            }
        }

        if (!longPressTriggered.current) return

        const element = document.elementFromPoint(touch.clientX, touch.clientY)
        const nav = element?.closest(".SMnavButt") as HTMLElement | null
        const tab = nav?.dataset.tab as tab | undefined

        if (tab) {
            setExtraMenu(tab)
        }
    }

    const handleNavEnter = (tab: tab) => {
        if (longPressTriggered.current) {
            setExtraMenu(tab)
        }
    }

    const navFunc = (tab: tab) => {
        if (wasLongPress.current) return

        if (tab !== activeTab) {
            setExtraMenu(tab)
            setActiveTab(tab)
        } else {
            setExtraMenu(tab)
            setIsExtraOpen(prev => !prev)
        }
    }

    const messageSelected = chatsFilters.find(f => f.value === messageSelectedValue)
        ?? { label: "Чаты", value: "chats", new: "" }

    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue)
        ?? { label: "Актив", value: "all", new: "0" }

    const extraButts = () => {
        switch (extraMenu) {
            case "chats":
                return (
                    <div
                        className="SMextraMenuButt"
                        onMouseUp={() => {
                            setBlackout({ seted: true, module: "CreateChat" })
                            setIsExtraOpen(false)
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            setBlackout({ seted: true, module: "CreateChat" })
                            setIsExtraOpen(false)
                        }}
                    >
                        <PlusIcon size={20} /> Новая беседа
                    </div>
                )
            case "habits":
                return (
                    <div
                        className="SMextraMenuButt"
                        onMouseUp={() => {
                            setBlackout({ seted: true, module: "AddHabit" })
                            setIsExtraOpen(false)
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            setBlackout({ seted: true, module: "AddHabit" })
                            setIsExtraOpen(false)
                        }}
                    >
                        <PlusIcon size={20} /> Новая активность
                    </div>
                )
            case "spots":
                return (
                    <div
                        className="SMextraMenuButt"
                        onMouseUp={() => {
                            showNotification("info", "В разработке")
                            setIsExtraOpen(false)
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            showNotification("info", "В разработке")
                            setIsExtraOpen(false)
                        }}
                    >
                        <PlusIcon size={20} /> Новый спот
                    </div>
                )
            case "user":
                return (
                    <>
                        <div
                            className="SMextraMenuButt user"
                            onMouseUp={() => {
                                navigate(`/acc/${user.nick}`)
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault()
                                navigate(`/acc/${user.nick}`)
                                setIsExtraOpen(false)
                            }}
                        >
                            <UserIcon weight="fill" size={20} /> В профиль
                        </div>
                        <div
                            className="SMextraMenuButt user"
                            onMouseUp={() => {
                                navigate(`/settings`)
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault()
                                navigate(`/settings`)
                                setIsExtraOpen(false)
                            }}
                        >
                            <GearIcon weight="fill" size={20} /> Настройки
                        </div>
                        <div
                            className="SMextraMenuButt logout user"
                            onMouseUp={() => {
                                showNotification("info", "В разработке")
                                setIsExtraOpen(false)
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault()
                                showNotification("info", "В разработке")
                                setIsExtraOpen(false)
                            }}
                        >
                            <SignOutIcon weight="fill" size={20} /> Выйти
                        </div>
                    </>
                )
        }
    }

    return (
        <div className="SMnavDiv">
            <div className={`SMnavExtraDiv ${isExtraOpen ? "open" : ""} ${extraMenu || ""}`} ref={filtersRef}>
                {extraButts()}
                {(extraMenu === "chats" || extraMenu === "habits") && <span className="SMextraSeparator" />}
                {(extraMenu === "chats" || extraMenu === "habits") &&
                    (extraMenu === "chats" ? chatsFilters : habitsFilters).map(filter => (
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
                            onTouchEnd={(e) => {
                                e.preventDefault()
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
                            <SortAscendingIcon />
                            {filter.label}
                            {extraMenu === "chats" && filter.new && (
                                <span className="new">{` ${filter.new}`}</span>
                            )}
                        </div>
                    ))}
            </div>

            <div className="SMnav" ref={tabsRef}>
                <div className={`SMnavActive ${activeTab}`} />

                <div
                    className={`SMnavButt ${activeTab === "chats" ? "active" : ""}`}
                    data-tab="chats"
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={() => startLongPress("chats")}
                    onMouseUp={() => navFunc("chats")}
                    onMouseEnter={() => handleNavEnter("chats")}
                    onTouchStart={(e) => {
                        const touch = e.touches[0]
                        startLongPress("chats", touch.clientX, touch.clientY)
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => navFunc("chats")}
                >
                    <ChatTeardropIcon weight="fill" />
                    <span>{messageSelected.label}</span>
                </div>

                <div
                    className={`SMnavButt ${activeTab === "habits" ? "active" : ""}`}
                    data-tab="habits"
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={() => startLongPress("habits")}
                    onMouseUp={() => navFunc("habits")}
                    onMouseEnter={() => handleNavEnter("habits")}
                    onTouchStart={(e) => {
                        const touch = e.touches[0]
                        startLongPress("habits", touch.clientX, touch.clientY)
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => navFunc("habits")}
                >
                    <CalendarCheckIcon weight="fill" />
                    <span>{habitsSelected.label}</span>
                </div>

                <div
                    className={`SMnavButt ${activeTab === "spots" ? "active" : ""}`}
                    data-tab="spots"
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={() => startLongPress("spots")}
                    onMouseUp={() => navFunc("spots")}
                    onMouseEnter={() => handleNavEnter("spots")}
                    onTouchStart={(e) => {
                        const touch = e.touches[0]
                        startLongPress("spots", touch.clientX, touch.clientY)
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => navFunc("spots")}
                >
                    <Megaphone fill="currentColor" />
                    <span>Споты</span>
                </div>

                <div
                    className={`SMnavButt SMnavAvatar ${activeTab === "user" ? "active" : ""}`}
                    data-tab="user"
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={() => startLongPress("user")}
                    onMouseUp={() => navFunc("user")}
                    onMouseEnter={() => handleNavEnter("user")}
                    onTouchStart={(e) => {
                        const touch = e.touches[0]
                        startLongPress("user", touch.clientX, touch.clientY)
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={() => navFunc("user")}
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