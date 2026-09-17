import { PushPin, PushPinSlash } from "@phosphor-icons/react"
import { api } from "../../api"
import type { CMFuncsType } from "./CMFuncsType"
import { useContacts } from "../../../hooks/ContactsHook"

export const TogglePinned = ({ id, bool} : CMFuncsType) => {
    const { refetchContactsWTLoading } = useContacts()
    
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