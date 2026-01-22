import { useEffect, useRef, useState } from "react"
import type { message } from "../../../components/context/ChatContext"
import { useUser } from "../../../components/hooks/UserHook"
import UserInChatUserList from "./UserInChatUserList"
import { List } from "@phosphor-icons/react"

interface PinnedType {
    messages:message[],
    scrollToMessage:(id:number) => void
}
export default function PinnedMessages({messages, scrollToMessage} : PinnedType) {
    const { user } = useUser()

    const pms = messages.filter(m => m.is_pinned)
    const [ showNow, setShowNow ] = useState<number>(pms.length - 1)
    const showing = pms[showNow] || pms[showNow + 1] || "";
    const [ showList, setShowList ] = useState(false)
    const [isHolding, setIsHolding] = useState(false)

    const pmRef = useRef<HTMLDivElement | null>(null)
    const timerRef = useRef<number | null>(null)
    const longPressTriggered = useRef(false)
    const listRef = useRef<HTMLDivElement | null>(null)
    const mouseYRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)

    console.log(timerRef)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                pmRef.current &&
                !pmRef.current.contains(e.target as Node)
            ) {
                setShowList(false);
                timerRef.current = null
                if (timerRef.current) clearTimeout(timerRef.current)
                setIsHolding(false)
            }
        };
        document.addEventListener("mouseup", handleClickOutside);
        return () => document.removeEventListener("mouseup", handleClickOutside);
    }, []);

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

    const scrollToPin = (m:message, current:number) => {
        scrollToMessage(m.id)
        setShowNow(current < pms.length - 1 ? current + 1 : 0)
    }

    const mouseDown = () => {
        longPressTriggered.current = false
        timerRef.current = window.setTimeout(() => {
            longPressTriggered.current = true
            setShowList(true)
            setIsHolding(true)
        }, 350)
    }

    const mouseUp = () => {
        setIsHolding(false)
        if (timerRef.current) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }
    return (
        <div className="pinnedMessages" ref={pmRef} style={{cursor:isHolding ? "grabbing" : "pointer"}}>
            <div className="pmsMain">
                <div className="pmShowInfo" onMouseDown={mouseDown}
                    onMouseUp={mouseUp}
                    onClick={() => {
                        if (longPressTriggered.current) return
                        scrollToPin(pms[showNow], showNow)
                    }}
                >
                    <span className="pmsCount">
                        {showNow + 1}/{pms.length} закреплённое сообщение
                    </span>
                    <div className="pmsShowNow">
                        <span className="pmsSender">
                            {showing.sender_id === user.id ? "Вы" : showing.sender_name || showing.sender_nick}: 
                        </span>
                        &nbsp;
                        <span className="pmsText">
                            {` ${showing.content || showing.files?.length || "Пересланное сообщение"}`}
                        </span>
                    </div>
                </div>
                <div className="showList" onClick={(e) => {
                    e.preventDefault()
                    setShowList(!showList)
                }}>
                    <List/>
                </div>
            </div>
            <div className={`pmsList ${showList ? "open" : "close"}`} ref={listRef} onMouseUp={mouseUp}>
                    {pms.map((pm, i) => (
                        <div className="pm" key={pm.id} onClick={() => scrollToPin(pm, i)} onMouseUp={() => {
                            scrollToPin(pm, i)
                            setShowList(false)
                            mouseUp()
                        }}
                        >
                            <UserInChatUserList m={pm}/>
                        </div>
                    ))}
                </div>
        </div>
    )
}