import "../../../scss/SM/contactsList.scss"
import { CircleUserRound } from "lucide-react"
import { useNavigate } from "react-router"
import { useParams } from "react-router"
import { useChat } from "../../hooks/ChatHook"

export default function ContactsList() {
    const { list } = useChat()
    const { contactId } = useParams<{ contactId: string }>()
    const navigate = useNavigate()

    const messageGetTime = (date:Date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 

    const sortedList = list.slice().sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return timeB - timeA;
    });

    return (
        <div className="contactsList SMlist">
            {list ? (
                sortedList.map((acc) => (
                    <div className={`contactsUser ${Number(contactId) === acc.id ? "active" : "" }`} key={acc.id} onClick={() => navigate(`/chat/${acc.id}`)}>
                        <div className="contactsUserPic">
                            {acc.avatar_url ? (
                                <img className="contactsUserAvatar" src={acc.avatar_url} alt={acc.username ?? acc.nick} />
                            ) : (
                                <CircleUserRound/>
                            )}
                        </div>
                        <div className="contactsUserInfo">
                            <div className="contactsUserStr">
                                <span className="nameSpan">{acc.username ? acc.username: acc.nick}</span>
                                {!acc.lastMessage && (
                                    <span className="secSpan">{acc.username ? `| ${acc.nick}`: ""}</span>
                                )}
                            </div>
                            {acc.lastMessage && (
                                <div className="lastMess">
                                    {acc.lastMessage.sender_id !== acc.id && (
                                        <span>Вы:</span>
                                    )}
                                    <span className="lmc">{acc.lastMessage.content}</span>
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