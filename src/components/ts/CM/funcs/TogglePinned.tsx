import { PushPin, PushPinSlash } from "@phosphor-icons/react"
import { useChat } from "../../../hooks/ChatHook"
import { api } from "../../api"
import type { CMFuncsType } from "./CMFuncsType"

export const TogglePinned = ({ id, bool} : CMFuncsType) => {
    const { refetchContactsWTLoading } = useChat()
    
    const togglePinned = async() => {
        try {
            const res = await api.post("/togglepinned", {id: id})
            if (res.data.success) {
                refetchContactsWTLoading()
            }
        } catch (error) {
            console.log("Ошибка при переключении закрепления:", error)
        }
    }
    return (
        <div className="ContextMenuButt" onClick={() => togglePinned()}>
            {bool ? <PushPinSlash/> : <PushPin/>}
            {bool? "Открепить чат" : "Закрепить чат"}
        </div>
    )
}