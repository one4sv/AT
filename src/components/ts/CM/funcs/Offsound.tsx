import { Bell, BellSlash } from "@phosphor-icons/react"
import { api } from "../../api"
import type { CMFuncsType } from "./CMFuncsType"
import { useContacts } from "../../../hooks/ContactsHook"

export const OffSound = ({ id, bool} : CMFuncsType) => {
    const { refetchContactsWTLoading } = useContacts()
    
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