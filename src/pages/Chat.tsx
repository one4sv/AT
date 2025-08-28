import { useNavigate, useParams } from "react-router"
import { useChat } from "../components/hooks/ChatHook"
import { useEffect, useRef, useState, Fragment } from "react"
import "../scss/Chat.scss"
import { CircleUserRound, Bell, ChevronLeft, SendHorizontal, Paperclip } from "lucide-react"
import Loader from "../components/ts/Loader"

export default function Chat () {
    const { refetchChat, chatWith, chatLoading, sendMess, messages } = useChat()

    const navigate = useNavigate()
    const { contactId } = useParams<{ contactId: string }>()

    const [ mess, setMess ] = useState<string>("")
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const chatRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (contactId) refetchChat(contactId)
        else navigate("/")
    }, [contactId])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (e.ctrlKey) {
                setMess(prev => prev + "\n")
            } else {
                e.preventDefault()
                if (mess.trim() && contactId) {
                    sendMess(contactId, mess.trim())
                    setMess("")
                }
            }
        }
    }
    useEffect(() => {
        const ta = textAreaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.minHeight = "7vh";
        ta.style.height = ta.scrollHeight + "px";
    }, [mess]);

    useEffect(() => {
        const el = chatRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages, chatLoading, contactId]);
    
    const messageGetTime = (date:Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const isSameDay = (a: Date, b: Date) => {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    const formatDateLabel = (d: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (isSameDay(d, today)) return "сегодня";
        if (isSameDay(d, yesterday)) return "вчера";
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    }
    if (chatLoading) return <Loader />
    
    return(
        <div className="chatDiv">
            <div className="chatUser">
                <div className="chatUserBack" onClick={() => navigate("/")}>
                    <ChevronLeft />
                </div>
                <div className="chatUserInfo" onClick={() => navigate(`/acc/${contactId}`)}>
                    <div className="chatUserPick">
                        {chatWith.avatar_url ? (
                            <img className="chatUserAvatar" src={chatWith.avatar_url} alt={chatWith.username ?? chatWith.nick} />
                        ) : (
                            <CircleUserRound/>
                        )}
                    </div>
                    <div className="chatUserName">
                        <span>{chatWith.username ?? chatWith.nick}</span>
                        <span className="wasOnline">был в сети 16 марта</span>
                    </div>
                </div>
                <div className="chatUserMenu">
                    <div className="muteButt">
                        <Bell />
                    </div>
                </div>
            </div>
            <div className="chat" ref={chatRef}>
                {messages.map((m, i) => {
                    const currDate = new Date(m.created_at);
                    const prev = messages[i - 1];
                    const prevDate = prev ? new Date(prev.created_at) : null;
                    const needDivider = !prevDate || !isSameDay(prevDate, currDate);
                    return (
                        <Fragment key={`${m.id}-${i}`}>
                            {needDivider && <div className="dateDivider">{formatDateLabel(currDate)}</div>}
                            <div className="messageWrapper">
                                <div className={`message ${m.sender_id === Number(contactId) ? "ur" : "my"}`}>
                                    <div className="messageText">{m.content}</div>
                                    <div className="messageDate">{messageGetTime(m.created_at)}</div>
                                </div>
                            </div>
                        </Fragment>
                    )
                })}
            </div>
            <div className="chatTAWrapper">
                <textarea
                    name="chatTA"
                    id="chatTA"
                    className="chatTA"
                    value={mess}
                    ref={textAreaRef}
                    onChange={(e) => setMess(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="chatTAMenu">
                    <div className="chatTAbutt">
                        <Paperclip className="chatFile"/>
                    </div>                    
                    <div className="chatTAbutt" onClick={() => {
                        if (contactId && mess.trim()) {
                            sendMess(contactId, mess.trim())
                            setMess("")
                        }
                    }}>
                        <SendHorizontal className="chatSend" fill="currenColor"/>
                    </div>
                </div>
            </div>
        </div>
    )
}