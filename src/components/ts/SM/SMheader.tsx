import { isMobile } from "react-device-detect"
import { useSideMenu } from "../../hooks/SideMenuHook"
import { useUser } from "../../hooks/UserHook"
import { useSettings } from "../../hooks/SettingsHook"
import { QrCodeIcon, ShareFatIcon, SortAscendingIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { useBlackout } from "../../hooks/BlackoutHook"

export default function SMheader() {
    const { user } = useUser()
    const {
        activeTab,
        setActiveTab,
        translateX,
        chatsFilters,
        habitsFilters,
        messageSelectedValue,
        setMessageSelectedValue,
        habitsSelectedValue,
        setHabitsSelectedValue,
    } = useSideMenu()
    const { layout } = useSettings()
    const { setBlackout } = useBlackout()

    const [openFilters, setOpenFilters] = useState<"chats" | "habits" | null>(null)

    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
    const wasLongPress = useRef(false)
    const isPointerDown = useRef(false)
    const filtersRef = useRef<HTMLDivElement>(null)
    const touchHoverRef = useRef<HTMLElement | null>(null)

    const translateSlider =
        activeTab === "chats" ? 0 :
        activeTab === "habits" ? -25 :
        activeTab === "spots" ? -50 :
        activeTab === "user" ? -75 :
        0

    const messageSelected = chatsFilters.find(f => f.value === messageSelectedValue)
        ?? { label: "Чаты", value: "chats", new: "" }

    const habitsSelected = habitsFilters.find(f => f.value === habitsSelectedValue)
        ?? { label: "Актив", value: "all", new: "0" }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (isPointerDown.current || wasLongPress.current) return

            const target = e.target as Node
            if (filtersRef.current?.contains(target)) return

            setOpenFilters(null)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("touchstart", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("touchstart", handleClickOutside)
        }
    }, [])

    const setTouchHover = (element: HTMLElement | null) => {
        if (touchHoverRef.current === element) return
        touchHoverRef.current?.classList.remove("touchHover")
        if (element) element.classList.add("touchHover")
        touchHoverRef.current = element
    }

    const startLongPress = (type: "chats" | "habits") => {
        isPointerDown.current = true
        longPressTriggered.current = false
        wasLongPress.current = false

        if (timerRef.current) clearTimeout(timerRef.current)

        timerRef.current = window.setTimeout(() => {
            longPressTriggered.current = true
            wasLongPress.current = true
            setOpenFilters(type)
        }, 350)
    }

    const cancelLongPress = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        longPressTriggered.current = false
    }

    const handleClick = (type: "chats" | "habits") => {
        if (wasLongPress.current) return
        setOpenFilters(prev => (prev === type ? null : type))
    }

    const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
        if (!longPressTriggered.current && !wasLongPress.current) return

        const touch = "touches" in e ? e.touches[0] : (e as TouchEvent).touches?.[0]
        if (!touch) return

        const element = document.elementFromPoint(touch.clientX, touch.clientY)
        const filterItem = element?.closest(".filterItem") as HTMLElement | null

        if (filterItem) {
            setTouchHover(filterItem)
        } else {
            setTouchHover(null)
        }
    }

    useEffect(() => {
        const handlePointerUp = (e: MouseEvent | TouchEvent) => {
            const wasLong = wasLongPress.current

            isPointerDown.current = false
            cancelLongPress()

            if (!wasLong) {
                wasLongPress.current = false
                setTouchHover(null)
                return
            }

            let clientX: number
            let clientY: number

            if ("changedTouches" in e) {
                const touch = e.changedTouches[0]
                if (!touch) {
                    setOpenFilters(null)
                    wasLongPress.current = false
                    setTouchHover(null)
                    return
                }
                clientX = touch.clientX
                clientY = touch.clientY
            } else {
                clientX = e.clientX
                clientY = e.clientY
            }

            const element = document.elementFromPoint(clientX, clientY)
            const filterItem = element?.closest(".filterItem") as HTMLElement | null

            if (filterItem && openFilters) {
                const value = filterItem.dataset.value
                if (value) {
                    if (openFilters === "chats") {
                        setMessageSelectedValue(value)
                        setActiveTab("chats")
                    } else {
                        setHabitsSelectedValue(value)
                        setActiveTab("habits")
                    }
                }
            }

            if (!filterItem) {
                setOpenFilters(null)
            } else {
                setOpenFilters(null)
            }

            wasLongPress.current = false
            setTouchHover(null)
        }

        document.addEventListener("mouseup", handlePointerUp)
        document.addEventListener("touchend", handlePointerUp)
        document.addEventListener("touchcancel", handlePointerUp)
        document.addEventListener("touchmove", handleTouchMove)

        return () => {
            document.removeEventListener("mouseup", handlePointerUp)
            document.removeEventListener("touchend", handlePointerUp)
            document.removeEventListener("touchcancel", handlePointerUp)
            document.removeEventListener("touchmove", handleTouchMove)
        }
    }, [openFilters])

    const selectFilter = (e: React.MouseEvent | React.TouchEvent, value: string, type: "chats" | "habits") => {
        e.stopPropagation()
        e.preventDefault()

        if (type === "chats") {
            setMessageSelectedValue(value)
            setActiveTab("chats")
        } else {
            setHabitsSelectedValue(value)
            setActiveTab("habits")
        }
        setOpenFilters(null)
    }

    const currentFilters = openFilters === "chats" ? chatsFilters : openFilters === "habits" ? habitsFilters : []
    const currentSelected = openFilters === "chats" ? messageSelectedValue : habitsSelectedValue

    if (!user.id) return null

    return (
        <div
            className={`smHeader ${openFilters ? "filtersOpen" : ""}`}
            style={{
                transform: isMobile || layout === "hidden" ? `translateX(${translateX}%)` : "none",
            }}
        >
            <div className="smHeaderSliderWrapper">
                <div
                    className="smHeaderSlider"
                    style={{ transform: `translateX(${translateSlider}%)` }}
                >
                    <div className="smHeaderPart">
                        <div className="smHeaderTitle">Чаты</div>
                        <div
                            className={`smHeaderSelected ${openFilters === "chats" ? "open" : ""}`}
                            onMouseDown={() => startLongPress("chats")}
                            onTouchStart={() => startLongPress("chats")}
                            onMouseUp={() => handleClick("chats")}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <SortAscendingIcon />
                            {messageSelected.label}
                            {messageSelected.new && (
                                <span className="headerBadge">{messageSelected.new}</span>
                            )}
                        </div>
                    </div>

                    <div className="smHeaderPart">
                        <div className="smHeaderTitle">Активности</div>
                        <div
                            className={`smHeaderSelected ${openFilters === "habits" ? "open" : ""}`}
                            onMouseDown={() => startLongPress("habits")}
                            onTouchStart={() => startLongPress("habits")}
                            onMouseUp={() => handleClick("habits")}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <SortAscendingIcon />
                            {habitsSelected.label}
                        </div>
                    </div>

                    <div className="smHeaderPart">
                        <div className="smHeaderTitle">Споты</div>
                    </div>

                    <div className="smHeaderPart">
                        <div className="smHeaderTitle">{user.nick ?? "Загрузка"}</div>
                        <div
                            className={`smHeaderSelected`}
                            onClick={() => setBlackout({seted:true, module:"ShareAcc", options:{name:user.username ?? "", nick:user.nick ?? "", url:user.avatar_url ?? ""}})}
                        >
                            <ShareFatIcon />
                            <QrCodeIcon/>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`smHeaderExtraDiv ${openFilters ? "open" : ""}`}
                ref={filtersRef}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                {currentFilters.map((filter) => (
                    <div
                        key={filter.value}
                        className={`filterItem ${currentSelected === filter.value ? "selected" : ""}`}
                        data-value={filter.value}
                        onMouseDown={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                        onTouchStart={(e) => e.stopPropagation()}
                        onMouseUp={(e) => openFilters && selectFilter(e, filter.value, openFilters)}
                    >
                        <SortAscendingIcon size={16} />
                        {filter.label}
                        {openFilters === "chats" && filter.new && (
                            <span className="new">{filter.new}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}