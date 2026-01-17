import type { Acc } from "../context/ChatContext";
import { PushPin, SpeakerSimpleX } from "@phosphor-icons/react"
import { Check, CheckCheck, CircleUserRound } from "lucide-react"
import { isMobile } from "react-device-detect"
import { useChat } from "../hooks/ChatHook";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useNavigate, useParams } from "react-router-dom";
import { useDrop } from "../hooks/DropHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";

export interface ContactType {
    acc:Acc
}

export default function Contact({acc}:ContactType) {
    const { onlineMap, typingStatus } = useChat()
    const { setBlackout } = useBlackout()
    const { openMenu } = useContextMenu()
    const { setDroppedFiles } = useDrop()
    const { setIsChose } = useMessages()

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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, nick:string) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            navigate(`/chat/${nick}`);
            setTimeout(() => {
                setDroppedFiles(prev => [...prev, ...droppedFiles]);
        }, 10);
        }
    };

    return (
        <div className={`contactsUser ${nick === acc.nick ? "active" : "" }`} key={acc.id} onClick={() => {
            navigate(`/chat/${acc.nick}`)
            setBlackout({seted:false})
            setIsChose(false)
        }} onContextMenu={(e) => {
            e.preventDefault()
            openMenu(e.clientX, e.clientY, "chat", {id:acc.id, isMy:acc.lastMessage?.id !== undefined, name:acc.username ? acc.username : acc.nick, nick:acc.nick}, undefined, {note:acc.note, is_blocked:acc.is_blocked, pinned:acc.pinned})
        }}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
            e.preventDefault();
            handleDrop(e, acc.nick);
        }}
        >
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
                    {acc.lastMessage?.sender_id === acc.id ? (
                        acc.unread_count > 0 && (
                            <div className="contactsUnreadCount">{acc.unread_count}</div>
                    )) : (
                        acc.lastMessage && acc.lastMessage?.read_by.length > 0 ? (
                            <CheckCheck className="isReadCL" height={18}/>
                        ):(
                            <Check className="isReadCL" height={18}/>
                        )
                    )}
                </div>
                {typingStatus ? 
                    "Печатает..."
                :
                    acc.lastMessage && (
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
                    )
                }
            </div>
        </div>
    )
}