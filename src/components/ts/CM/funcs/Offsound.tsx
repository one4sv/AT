import { Bell, BellSlash } from "@phosphor-icons/react"
import { useChat } from "../../../hooks/ChatHook"
import { api } from "../../api"
import type { CMFuncsType } from "./CMFuncsType"

export const OffSound = ({ id, bool} : CMFuncsType) => {
    const { refetchContactsWTLoading } = useChat()
    
    const offSound = async() => {
        try{
            const res = await api.post("/offsound", {id: id})
            if (res.data.success) {
                refetchContactsWTLoading()
            }
        } catch (error) {
            console.log("Ошибка при отключении звуков:", error)
        }
    }
    return (
        <div className="ContextMenuButt" onClick={() => offSound()}>
            {bool ? <BellSlash/> : <Bell/>}
            {bool ? "Без звука" : "Включить звук"}
        </div>
    )
}