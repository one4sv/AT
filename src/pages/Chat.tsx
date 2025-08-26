import { useNavigate, useParams } from "react-router"
import { useChat } from "../components/hooks/ChatHook"
import { useEffect, useState } from "react"
import "../scss/Chat.scss"
import { CircleUserRound, Bell, ChevronLeft, SendHorizontal, Paperclip } from "lucide-react"
import Loader from "../components/ts/Loader"

export default function Chat () {
    const { refetchChat, chatWith, chatLoading, sendMess, messages } = useChat()

    const navigate = useNavigate()
    const { contactId } = useParams<{ contactId: string }>()

    const [ mess, setMess ] = useState<string>("")

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
    
    const messageGetTime = (date:Date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                        <CircleUserRound/>
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
            <div className="chat">
                {messages.map((mess) => (
                    <div className="messageWrapper" key={mess.id}>
                        <div className={`message ${mess.sender_id === Number(contactId) ? "ur" : "my"}`}>
                            <div className="messageText">{mess.content}</div>
                            <div className="messageDate">{messageGetTime(mess.created_at)}</div>
                        </div>
                    </div>
                    
                ))}
            </div>
            <div className="chatTAWrapper">
                <textarea name="chatTA" id="chatTA" className="chatTA" value={mess} onChange={(e) => setMess(e.currentTarget.value)} onKeyDown={handleKeyDown}>
                </textarea>
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