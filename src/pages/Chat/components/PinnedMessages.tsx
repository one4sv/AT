import { useState } from "react"
import type { message } from "../../../components/context/ChatContext"
import { useUser } from "../../../components/hooks/UserHook"

interface PinnedType {
    messages:message[]
}
export default function PinnedMessages({messages} : PinnedType) {
    const { user } = useUser()
    const pms = messages.filter(m => m.is_pinned)
    const [ showNow, setShowNow ] = useState<number>(pms.length - 1)
    const showing = pms[showNow] || pms[showNow - 1] || "";
    
    return (
        <div className="pinnedMessages">
            <div className="pmsMain" onClick={() => {
                
                setShowNow(showNow < pms.length - 1 ? showNow + 1 : 0)
            }}>
                <span className="pmsCount">
                    {pms.length} {pms.length === 1
                        ? "закреплённое сообщение"
                        : pms.length < 5
                            ? "закреплённых сообщения"
                            : "закрелённых сообщений"
                    }
                </span>
                <div className="pmsShowNow">
                    {`${showing.sender_id === user.id ? "Вы" : showing.sender_name || showing.sender_nick}: ${showing.content || showing.files?.length || "Пересланное сообщение"}`}
                </div>
            </div>
        </div>
    )
}