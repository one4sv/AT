import ReportButton from "../buttons/ReportButton";
import { ChatTeardropIcon, LinkSimpleIcon, ShareNetworkIcon, UserIcon } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useContextMenu } from "../../../hooks/ContextMenuHook"
import { useNote } from "../../../hooks/NoteHook"
import { useUser } from "../../../hooks/UserHook"
import { ToggleBlocked } from "../buttons/ToggleBlocked"

export default function PersonMenu() {
    const { t } = useTranslation("common")
    const { menu, closeMenu } = useContextMenu()
    const { showNotification } = useNote()
    const { user } = useUser()
    const navigate = useNavigate()
    const { options } = menu
    const nick = options.nick
    if (!nick) return null

    const url = new URL(`/acc/${encodeURIComponent(nick)}`, window.location.origin).href
    const open = (path: string) => {
        closeMenu()
        navigate(path)
    }
    const copy = async () => {
        closeMenu()
        try {
            await navigator.clipboard.writeText(url)
            showNotification("success", t("chatMenu.linkCopied"))
        } catch {
            showNotification("error", t("chatMenu.copyFailed"))
        }
    }
    const share = async () => {
        if (!navigator.share) return copy()
        closeMenu()
        try {
            await navigator.share({ url, title: options.name || nick })
        } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError")) {
                showNotification("error", t("chatMenu.copyFailed"))
            }
        }
    }

    return <>
        <div className="ContextMenuButt" onClick={() => open(`/acc/${nick}`)}>
            <UserIcon/> {t("chatUi.openProfile")}
        </div>
        {user.id && options.id !== user.id && <div className="ContextMenuButt" onClick={() => open(`/chat/${nick}`)}>
            <ChatTeardropIcon/> {t("chatMenu.openChat")}
        </div>}
        <div className="ContextMenuButt" onClick={() => void copy()}>
            <LinkSimpleIcon/> {t("chatMenu.copyProfileLink")}
        </div>
        <div className="ContextMenuButt" onClick={() => void share()}>
            <ShareNetworkIcon/> {t("chatMenu.shareProfile")}
        </div>
        {user.id && options.id !== user.id && <ToggleBlocked id={options.id} nick={nick} name={options.name}/>}
        <ReportButton targetType="account" isMy={String(options.id) === String(user.id)}/>
    </>
}
