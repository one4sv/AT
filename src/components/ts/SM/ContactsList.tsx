import "../../../scss/SM/contactsList.scss"
import { CircleUserRound } from "lucide-react"
import { useNavigate } from "react-router"
import { useParams } from "react-router"
import { useChat } from "../../hooks/ChatHook"
import { isMobile } from "react-device-detect"
import { useContextMenu } from "../../hooks/ContextMenuHook"
import { PushPin, SpeakerSimpleX } from "@phosphor-icons/react"

export default function ContactsList() {
    const { list, onlineMap } = useChat()
    const { openMenu } = useContextMenu()
    const { nick } = useParams<{ nick: string }>()
    const navigate = useNavigate()

    const messageGetTime = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (diff < oneDay) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return d.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
            });
        }
    };

    const sortedList = list.slice().sort((a, b) => {
        // 1. Сначала закреплённые
        if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1; 
        }

        // 2. Потом по времени последнего сообщения
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;

        return timeB - timeA;
    });

    return (
        <div className="contactsList SMlist">
            {list ? (
                sortedList.map((acc) => (
                    <div className={`contactsUser ${nick === acc.nick ? "active" : "" }`} key={acc.id} onClick={() => navigate(`/chat/${acc.nick}`)} onContextMenu={(e) => {
                        e.preventDefault()
                        openMenu(e.clientX, e.clientY, "chat", {id:acc.id, isMy:acc.lastMessage?.id !== undefined, name:acc.username ? acc.username : acc.nick, nick:acc.nick}, undefined, {note:acc.note, is_blocked:acc.is_blocked, pinned:acc.pinned})
                    }}>
                        <div className="contactsUserPic">
                            {acc.avatar_url ? (
                                <img className="contactsUserAvatar" src={acc.avatar_url} alt={acc.username ?? acc.nick} />
                            ) : (
                                <CircleUserRound/>
                            )}
                            <div className={`contactOnlineStauts ${nick !== acc.nick && onlineMap[acc?.nick || ""] ? "online" : "offline"}`}></div>
                        </div>
                        <div className={`contactsUserInfo ${isMobile ? "mobile" : ""}`}>
                            <div className="contactsUserStr">
                                <span className="nameSpan">{acc.username ? acc.username: acc.nick} {acc.note ? "" : <SpeakerSimpleX weight="fill"/>} {acc.pinned ? <PushPin weight="fill"/> : ""}</span>
                                {!acc.lastMessage && (
                                    <span className="secSpan">{acc.username ? `| ${acc.nick}`: ""}</span>
                                )}
                                {acc.unread_count > 0 && (
                                    <div className="contactsUnreadCount">{acc.unread_count}</div>
                                )}
                            </div>
                            {acc.lastMessage && (
                                <div className={`lastMess ${isMobile ? "mobile" : ""}`}>
                                    <div>
                                    {acc.lastMessage.sender_id !== acc.id && <span>Вы: </span>}
                                    <span className="lmc">
                                        {acc.lastMessage.content && <span>{acc.lastMessage.content} </span>}
                                        {acc.lastMessage.files?.length ? (
                                            <span className="lmcMediafile">
                                                {acc.lastMessage.files.length} mediafile{acc.lastMessage.files.length > 1 ? "s" : ""}
                                            </span>
                                        ) : null}
                                    </span>
                                    </div>
                                    <span>{messageGetTime(acc.lastMessage.created_at)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="contactsNothing">
                    Упс! Здесь никого нет.
                </div>
            )}
        </div>
    )
}