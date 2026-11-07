import { Prohibit } from "@phosphor-icons/react"
import { useChat } from "../../../hooks/ChatHook"
import { api } from "../../api"
import type { CMFuncsType } from "../funcs/CMFuncsType"
import { useLocation } from "react-router-dom"
import { useContacts } from "../../../hooks/ContactsHook"
import { useBlackout } from "../../../hooks/BlackoutHook"
import { useContextMenu } from "../../../hooks/ContextMenuHook"
import { useNote } from "../../../hooks/NoteHook"
import { useUser } from "../../../hooks/UserHook"
import { useTranslation } from "react-i18next"

export const ToggleBlocked = ({ nick, id, bool, name, className = "ContextMenuButt" }: CMFuncsType & { name?: string, className?: string }) => {
    const { t } = useTranslation("common")
    const { user } = useUser()
    const { refetchChat } = useChat()
    const { list, refetchContactsWTLoading } = useContacts()
    const { setBlackout } = useBlackout()
    const { closeMenu } = useContextMenu()
    const { showNotification } = useNote()
    const location = useLocation()
    const blocked = list.find(contact => !contact.is_group && contact.id === id)?.is_blocked ?? bool ?? false

    if (!id || id === user.id) return null

    const changeBlock = async () => {
        const response = await api.post("/toggleblocked", { id })
        if (!response.data.success) throw new Error("Could not change block")
        await refetchContactsWTLoading()
        if (nick && location.pathname === `/chat/${nick}`) await refetchChat(nick)
        showNotification("success", t(response.data.is_blocked ? "chatMenu.blocked" : "chatMenu.unblocked"))
    }

    const toggleBlocked = () => {
        closeMenu()
        if (blocked) {
            void changeBlock().catch(() => showNotification("error", t("chatMenu.blockFailed")))
            return
        }
        setBlackout({
            seted: true,
            module: "ConfirmAction",
            confirmAction: {
                title: t("chatMenu.blockUser"),
                description: t("chatMenu.blockUserDescription", { name: name || nick || t("chatUi.user") }),
                label: t("chatMenu.block"),
                run: changeBlock
            }
        })
    }

    return (
        <div className={`${className} ${blocked ? "" : "delete"}`} role="button" tabIndex={0}
            onClick={toggleBlocked}
            onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleBlocked() } }}>
            <Prohibit weight={blocked ? "fill" : "regular"}/>
            {t(blocked ? "chatMenu.unblock" : "chatMenu.block")}
        </div>
    )
}
