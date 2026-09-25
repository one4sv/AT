import { createContext, useEffect, useRef, useState, type ReactNode } from "react"

import type { message } from "./ChatContext"

import { useChatMessageScroll } from "../hooks/utils/useChatMessageScroll"
import { useChat } from "../hooks/ChatHook"

interface PinnedMessagesContextType {
    pms: message[]
    currentpm: message
    showNow: number
    showList: boolean
    isHolding: boolean
    longPressTriggered: React.MutableRefObject<boolean>
    pmRef: React.MutableRefObject<HTMLDivElement | null>
    listRef: React.MutableRefObject<HTMLDivElement | null>
    setShowList: React.Dispatch<React.SetStateAction<boolean>>
    mouseDown: () => void
    mouseUp: () => void
    scrollToPin: (pm: message | undefined, index: number) => void
}

const PinnedMessagesContext = createContext<PinnedMessagesContextType | null>(null)

export function PinnedMessagesProvider({ children }: {children: ReactNode}) {
    const { messages } = useChat()
    const pms = messages.filter(m => m.is_pinned)

    const { scrollToMessage } = useChatMessageScroll()
    const [showNow, setShowNow] = useState(Math.max(0, pms.length - 1))
    const [showList, setShowList] = useState(false)
    const [isHolding, setIsHolding] = useState(false)

    const currentpm = pms[showNow] ?? pms[pms.length - 1]

    const pmRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)
    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
    const mouseYRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        if (showNow >= pms.length) {
            setShowNow(Math.max(0, pms.length - 1))
        }
    }, [pms.length])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pmRef.current && !pmRef.current.contains(e.target as Node)) {
                setShowList(false)

                if (timerRef.current) {
                    clearTimeout(timerRef.current)
                    timerRef.current = null
                }

                setIsHolding(false)
            }
        }

        document.addEventListener("mouseup", handleClickOutside)

        return () => document.removeEventListener("mouseup", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseYRef.current = e.clientY
        }

        document.addEventListener("mousemove", handleMouseMove)

        return () => document.removeEventListener("mousemove", handleMouseMove)
    }, [])

    useEffect(() => {
        if (!isHolding || !showList) return

        const SCROLL_ZONE = 40
        const MAX_SPEED = 12

        const loop = () => {
            if (!listRef.current || mouseYRef.current === null) {
                rafRef.current = requestAnimationFrame(loop)
                return
            }

            const rect = listRef.current.getBoundingClientRect()
            const y = mouseYRef.current
            const distanceTop = rect.top + SCROLL_ZONE - y
            const distanceBottom = y - (rect.bottom - SCROLL_ZONE)

            if (distanceTop > 0) {
                listRef.current.scrollTop -= Math.min(MAX_SPEED, distanceTop / 3)
            } else if (distanceBottom > 0) {
                listRef.current.scrollTop += Math.min(MAX_SPEED, distanceBottom / 3)
            }

            rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [isHolding, showList])

    const mouseDown = () => {
        longPressTriggered.current = false

        timerRef.current = window.setTimeout(() => {
            longPressTriggered.current = true
            setShowList(true)
            setIsHolding(true)
        }, 450)
    }

    const mouseUp = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        setIsHolding(false)
    }

    const scrollToPin = (pm: message | undefined, index: number) => {
        if (!pm) return

        setShowNow(index)
        scrollToMessage(pm.id)
    }

    return (
        <PinnedMessagesContext.Provider
            value={{
                pms,
                currentpm,
                showNow,
                showList,
                isHolding,
                longPressTriggered,
                pmRef,
                listRef,
                setShowList,
                mouseDown,
                mouseUp,
                scrollToPin,
            }}
        >
            {children}
        </PinnedMessagesContext.Provider>
    )
}

export default PinnedMessagesContext