import { Prohibit } from "@phosphor-icons/react"
import { useChat } from "../../../hooks/ChatHook"
import { api } from "../../api"
import type { CMFuncsType } from "./CMFuncsType"
import { useLocation } from "react-router-dom"

export const ToggleBlocked = ({nick, id, bool} : CMFuncsType) => {
    const { refetchContactsWTLoading, refetchChat } = useChat()
    const location = useLocation()

    const toggleBlocked = async() => {
        try {
            const res = await api.post("/toggleblocked", {id: id})
            if (res.data.success) {
                refetchContactsWTLoading()
                if (location.pathname === `/chat/${nick}`) refetchChat(nick!)
            }
        } catch (error) {
            console.log("Ошибка при переключении блокировки:", error)
        }
    }
    return (
        <div className={`ContextMenuButt ${bool? "" : "delete"}`} onClick={() => toggleBlocked()}>
            {bool ? <Prohibit weight="fill"/> : <Prohibit/>}
            {bool ? "Разблокировать" : "Заблокировать"}
        </div>
    )
}