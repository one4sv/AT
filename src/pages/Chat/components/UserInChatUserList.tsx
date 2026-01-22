import { User } from "@phosphor-icons/react"
import type { message } from "../../../components/context/ChatContext"
import { useUser } from "../../../components/hooks/UserHook"
import { useIdentify } from "../../../components/hooks/utils/useIdentify"
import { useChat } from "../../../components/hooks/ChatHook"

interface ChatUserListType {
    m:message
}
export default function UserInChatUserList({m}:ChatUserListType) {
    const { user } = useUser()
    const { chatWith } = useChat()

    const isMy = m.sender_id === user.id
    const needIdentify = !isMy && chatWith && !chatWith.members.find(member => member.id === m.sender_id)?.avatar_url && chatWith.is_group
    const { identified } = useIdentify(needIdentify ? m.sender_id : undefined)

    return (
        <>
            <div className="chatSearchPic">
                {isMy && user.avatar_url ? (
                    <img src={user.avatar_url}/>
                ) : !isMy && chatWith && chatWith.avatar_url && !chatWith.is_group ? (
                    <img src={chatWith.avatar_url}/>
                ) : !isMy && chatWith && chatWith.members.find(member => member.id === m.sender_id)?.avatar_url && chatWith.is_group ? (
                    <img src={chatWith.members.find(member => member.id === m.sender_id)?.avatar_url}/>
                ) : identified !== null && identified.avatar_url !== null
                    ? <img src={identified?.avatar_url}/>
                    : <User/>
                }
            </div>
            <div className="chatSearchItemInfo">
                <div className="chatSearcSender">
                    <span className="chatSearchName">{isMy ? "Вы" : (m.sender_name || m.sender_nick)}</span>
                    <span className="chatSearchDate">{new Date(m.created_at).toLocaleDateString("ru-RU")}</span>
                </div>
                <div className="chatSearchText">
                    <span>{m.content}</span>
                </div>
            </div>
        </>
    )
}