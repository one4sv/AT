import { useUser } from "../../hooks/UserHook"
import { CircleUserRound, Megaphone } from "lucide-react"
import { CalendarCheckIcon, ChatTeardropIcon, GearIcon, NewspaperIcon, SneakerMoveIcon, PlusIcon, SignOutIcon, SortAscendingIcon, UserIcon, CheckIcon } from "@phosphor-icons/react"
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
import { isMobile } from "react-device-detect"

export default function SMnav() {
    const { t, i18n } = useTranslation("common")
    const { user, logOut } = useUser()
    const {
        setActiveTab,
        activeTab,
        messageSelectedValue,
        setMessageSelectedValue,
        habitsSelectedValue,
        setHabitsSelectedValue,
        setDontHandle,
        setDontHandleOther,
        translateX,
        showSideMenu
    } = useSideMenu()
    const { setBlackout } = useBlackout()
    const { list } = useContacts()
    const { habits, newOrderHabits } = useHabits()
    const { showArchived, layout } = useSettings()
    const { showNotification } = useNote()

    const navigate = useNavigate()

    const [ extraMenu, setExtraMenu ] = useState<tab>()
    const [ isExtraOpen, setIsExtraOpen ] = useState(false)
    const [ confirmLogout, setConfirmLogout ] = useState(false)
    const [ chatsFilters, setMessagesFilters ] = useState<{ label: string; value: string; new: string }[]>([])
    const [ habitsFilters, setHabitsFilters ] = useState<{ label: string; value: string; new: string }[]>([])

    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
    const wasLongPress = useRef(false)
    const isPointerDown = useRef(false)
    const touchStartPos = useRef<{ x: number; y: number } | null>(null)
    const tabsRef = useRef<HTMLDivElement>(null)
    const filtersRef = useRef<HTMLDivElement>(null)
    const touchHoverRef = useRef<HTMLElement | null>(null)

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
        const wasLongPressNow = wasLongPress.current

        isPointerDown.current = false

        if (!wasLongPressNow) {
            cancelLongPress()
            wasLongPress.current = false
            return
        }

        let clientX: number
        let clientY: number

        if ("changedTouches" in e) {
            const touch = e.changedTouches[0]

            if (!touch) {
                setTouchHover(null)
                setIsExtraOpen(false)
                cancelLongPress()
                wasLongPress.current = false
                return
            }

            clientX = touch.clientX
            clientY = touch.clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        const element = document.elementFromPoint(clientX, clientY)

        const extraTarget = element?.closest(
            ".SMextraMenuButt"
        ) as HTMLElement | null

        const filterTarget = element?.closest(
            ".filterItem"
        ) as HTMLElement | null

        const navTarget = element?.closest(
            ".SMnavButt"
        ) as HTMLElement | null

        if (extraTarget) {
            const action = extraTarget.dataset.action

            if (action === "create-chat") {
                setBlackout({ seted: true, module: "CreateChat" })
            }
            if (action === "add-habit") {
                setBlackout({ seted: true, module: "AddHabit" })
            }
            if (action === "new-spot") {
                showNotification("info", "В разработке")
            }
            if (action === "posts") {
                navigate("/")
            }            
            if (action === "habits") {
                navigate("/habit")
            }            
            if (action === "profile") {
                navigate(`/acc/${user.nick}`)
            }
            if (action === "settings") {
                navigate(`/settings`)
            }
            if (action === "logout") {
                if (!confirmLogout) {
                    setConfirmLogout(true)
                    setTouchHover(null)
                    cancelLongPress()
                    wasLongPress.current = false
                    return
                }
                else logOut()
            }

            setTouchHover(null)
            setIsExtraOpen(false)
            cancelLongPress()
            wasLongPress.current = false

            return
        }

        if (filterTarget) {
            const value = filterTarget.dataset.value
            const type = filterTarget.dataset.type

            if (value && type === "chats") {
                setMessageSelectedValue(value)
                setActiveTab("chats")
            }

            if (value && type === "habits") {
                setHabitsSelectedValue(value)
                setActiveTab("habits")
            }

            setTouchHover(null)
            setIsExtraOpen(false)
            cancelLongPress()
            wasLongPress.current = false

            return
        }

        if (navTarget) {
            const tab = navTarget.dataset.tab as tab | undefined

            if (tab) {
                setActiveTab(tab)
                setExtraMenu(tab)
            }

            setTouchHover(null)
            setIsExtraOpen(false)
            cancelLongPress()
            wasLongPress.current = false

            return
        }

        setTouchHover(null)
        setIsExtraOpen(false)
        cancelLongPress()
        wasLongPress.current = false
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
                setTouchHover(null)
                return
            }
        }

        if (!longPressTriggered.current) return

        const element = document.elementFromPoint(
            touch.clientX,
            touch.clientY
        )

        const extraButton = element?.closest(
            ".SMextraMenuButt"
        ) as HTMLElement | null

        const filter = element?.closest(
            ".filterItem"
        ) as HTMLElement | null

        const nav = element?.closest(
            ".SMnavButt"
        ) as HTMLElement | null

        if (extraButton) {
            setTouchHover(extraButton)
            return
        }

        if (filter) {
            setTouchHover(filter)
            return
        }

        if (nav) {
            const tab = nav.dataset.tab as tab | undefined

            if (tab) {
                setExtraMenu(tab)
            }

            setTouchHover(nav)
            return
        }

        setTouchHover(null)
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
    const setTouchHover = (element: HTMLElement | null) => {
        if (touchHoverRef.current === element) return

        touchHoverRef.current?.classList.remove("touchHover")

        if (element) {
            element.classList.add("touchHover")
        }

        touchHoverRef.current = element
    }

    const messageSelected = chatsFilters.find(f => f.value === messageSelectedValue)
        ?? { label: "Чаты", value: "chats", new: "" }

    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue)
        ?? { label: "Актив", value: "all", new: "0" }

    useEffect(() => {
        let timer: number | null = null

        if (!isExtraOpen || extraMenu !== "user") {
            timer = window.setTimeout(() => {
                setConfirmLogout(false)
            }, 300)
        }

        return () => {
            if (timer !== null) {
                clearTimeout(timer)
            }
        }
    }, [extraMenu, isExtraOpen])

    const extraButts = () => {
        switch (extraMenu) {
            case "chats":
                return (
                    <div
                        className="SMextraMenuButt"
                        data-action="create-chat"
                        onMouseUp={() => {
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
                        data-action="add-habit"
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
                        data-action="new-spot"
                    >
                        <PlusIcon size={20} /> Новый спот
                    </div>
                )
            case "user":
                return (
                    <>
                        <div
                            className={`SMextraMenuButt user ${location.pathname === `/acc/${user.nick}` ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate(`/acc/${user.nick}`)
                                setIsExtraOpen(false)
                            }}
                            data-action="profile"
                        >
                            <UserIcon weight="fill" size={20} /> Профиль
                        </div>
                        <div
                            className={`SMextraMenuButt user ${location.pathname === "/" ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate("/")
                                setIsExtraOpen(false)
                            }}
                            data-action="posts"
                        >
                            <NewspaperIcon weight="fill" size={20} /> Лента
                        </div>                        
                        <div
                            className={`SMextraMenuButt user ${location.pathname === "/habit" ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate("/habit")
                                setIsExtraOpen(false)
                            }}
                            data-action="habits"
                        >
                            <SneakerMoveIcon  weight="fill" size={20} /> Активности
                        </div>
                        <div
                            className={`SMextraMenuButt user ${location.pathname.includes("/settings") ? "selected" : ""}`}
                            onMouseUp={() => {
                                navigate(`/settings`)
                                setIsExtraOpen(false)
                            }}
                            data-action="settings"
                        >
                            <GearIcon weight="fill" size={20} /> Настройки
                        </div>
                        <span className="SMextraSeparator" />
                        <div
                            className={`SMextraMenuButt logout user ${confirmLogout ? "confirm" : ""}`}
                            onMouseUp={() => {
                                if (!confirmLogout) setConfirmLogout(true)
                                else {
                                    logOut()
                                    setIsExtraOpen(false)
                                }
                            }}
                            data-action="logout"
                        >
                            {!confirmLogout
                                ? <>
                                    <SignOutIcon weight="fill" size={20} /> Выйти
                                </> 
                                : <>
                                    <CheckIcon size={20} /> Да, выйти
                                </>
                            }
                        </div>
                    </>
                )
        }
    }

    if (!user.id) return null

    return (
        <div className={`SMnavDiv ${showSideMenu ? "open" : ""}`}
            style={{
                transform: isMobile || layout === "hidden" ? `translateX(${translateX}%)` : "none",
            }}
        >
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
                            data-value={filter.value}
                            data-type={extraMenu}
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
                    key={messageSelected.value}
                    onTouchStart={(e) => {
                        const touch = e.touches[0]
                        startLongPress("chats", touch.clientX, touch.clientY)
                    }}
                    onTouchMove={handleTouchMove}
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
                    key={habitsSelected.value}
                    onTouchStart={(e) => {
                        const touch = e.touches[0]
                        startLongPress("habits", touch.clientX, touch.clientY)
                    }}
                    onTouchMove={handleTouchMove}
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