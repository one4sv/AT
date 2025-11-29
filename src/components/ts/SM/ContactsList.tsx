import "../../../scss/SM/contactsList.scss"
import { CircleUserRound } from "lucide-react"
import { useNavigate } from "react-router"
import { useParams } from "react-router"
import { useChat } from "../../hooks/ChatHook"
import { isMobile } from "react-device-detect"
export default function ContactsList() {
    const { list, onlineMap } = useChat()
    const { contactId } = useParams<{ contactId: string }>()
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
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return timeB - timeA;
    });

    return (
        <div className="contactsList SMlist">
            {list ? (
                sortedList.map((acc) => (
                    <div className={`contactsUser ${contactId === acc.id ? "active" : "" }`} key={acc.id} onClick={() => navigate(`/chat/${acc.id}`)}>
                        <div className="contactsUserPic">
                            {acc.avatar_url ? (
                                <img className="contactsUserAvatar" src={acc.avatar_url} alt={acc.username ?? acc.nick} />
                            ) : (
                                <CircleUserRound/>
                            )}
                            <div className={`contactOnlineStauts ${contactId !== acc.id && onlineMap[acc?.id || ""] ? "online" : "offline"}`}></div>
                        </div>
                        <div className={`contactsUserInfo ${isMobile ? "mobile" : ""}`}>
                            <div className="contactsUserStr">
                                <span className="nameSpan">{acc.username ? acc.username: acc.nick}</span>
                                {!acc.lastMessage && (
                                    <span className="secSpan">{acc.username ? `| ${acc.nick}`: ""}</span>
                                )}
                                {acc.unread_count > 0 && (
                                    <div className="contactsUnreadCount">{acc.unread_count}</div>
                                )}
                            </div>
                            {acc.lastMessage && (
                                <div className={`lastMess ${isMobile ? "mobile" : ""}`}>
                                    {acc.lastMessage.sender_id !== acc.id && <span>Вы: </span>}
                                    <span className="lmc">
                                        {acc.lastMessage.content && <span>{acc.lastMessage.content} </span>}
                                        {acc.lastMessage.files?.length ? (
                                            <span className="lmcMediafile">
                                                {acc.lastMessage.files.length} mediafile{acc.lastMessage.files.length > 1 ? "s" : ""}
                                            </span>
                                        ) : null}
                                    </span>
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