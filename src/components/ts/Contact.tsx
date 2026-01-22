import type { Contact } from "../context/ChatContext";
import { PushPin, SpeakerSimpleX } from "@phosphor-icons/react"
import { Check, CheckCheck, CircleUserRound } from "lucide-react"
import { isMobile } from "react-device-detect"
import { useChat } from "../hooks/ChatHook";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useNavigate, useParams } from "react-router-dom";
import { useDrop } from "../hooks/DropHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useUser } from "../hooks/UserHook";
import { useIdentify } from  "../hooks/utils/useIdentify"
import { useMemo } from "react";

export interface ContactType {
    contact: Contact
}

export default function Contact({ contact }: ContactType) {
    const { onlineMap, typingStatus } = useChat()
    const { setBlackout } = useBlackout()
    const { openMenu } = useContextMenu()
    const { setDroppedFiles } = useDrop()
    const { setIsChose } = useMessages()
    const { user } = useUser()
    const { nick } = useParams<{ nick: string }>()
    const navigate = useNavigate()

    const { identified: targetForLast } = useIdentify(
        contact.lastMessage?.is_system && contact.lastMessage?.target_id
            ? contact.lastMessage.target_id.toString()
            : null
    );

    const partsLast = useMemo(() => {
        if (
            !contact.lastMessage?.is_system ||
            !contact.lastMessage?.content ||
            !contact.lastMessage.target_id
        ) {
            return null;
        }
        const split = contact.lastMessage.content.split("{}");
        return split.length === 2 ? { before: split[0], after: split[1] } : null;
    }, [contact.lastMessage?.content, contact.lastMessage?.is_system, contact.lastMessage?.target_id]);

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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, nick: string) => {
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
        <div
            className={`contactsUser ${nick === contact.nick ? "active" : ""}`}
            key={contact.id}
            onClick={() => {
                if (contact.is_group) navigate(`/chat/g/${contact.id}`)
                else navigate(`/chat/${contact.nick}`)
                setBlackout({ seted: false })
                setIsChose(false)
            }}
            onContextMenu={(e) => {
                e.preventDefault()
                openMenu(e.clientX, e.clientY, "chat",
                    { id: contact.id, isMy: contact.lastMessage?.id !== undefined, name: contact.name ? contact.name : contact.nick, nick: contact.nick },
                    undefined,
                    { note: contact.note, is_blocked: contact.is_blocked, pinned: contact.pinned, is_group: contact.is_group }
                )
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                handleDrop(e, contact.nick);
            }}
        >
            <div className="contactsUserPic">
                {contact.avatar_url ? (
                    <img className="contactsUserAvatar" src={contact.avatar_url} alt={contact.name ?? contact.nick} />
                ) : (
                    <CircleUserRound />
                )}
                <div className={`contactOnlineStauts ${nick !== contact.nick && onlineMap[contact?.id || ""] ? "online" : "offline"}`}></div>
            </div>
            <div className={`contactsUserInfo ${isMobile ? "mobile" : ""}`}>
                <div className="contactsUserStr">
                    <span className="nameSpan">
                        {contact.name ? contact.name : contact.nick}
                        {contact.note === false ? <SpeakerSimpleX weight="fill" /> : ""}
                        {contact.pinned ? <PushPin weight="fill" /> : ""}
                    </span>
                    {!contact.lastMessage && (
                        <span className="secSpan">{contact.name ? `| ${contact.nick}` : ""}</span>
                    )}
                    {contact.lastMessage?.sender_id !== user.id ? (
                        contact.unread_count > 0 && (
                            <div className="contactsUnreadCount">{contact.unread_count}</div>
                        )
                    ) : (
                        contact.lastMessage && contact.lastMessage?.read_by.length > 0 ? (
                            <CheckCheck className="isReadCL" height={18} />
                        ) : (
                            <Check className="isReadCL" height={18} />
                        )
                    )}
                </div>
                {typingStatus
                    ? "Печатает..."
                    : contact.lastMessage && (
                        <div className={`lastMess ${isMobile ? "mobile" : ""}`}>
                            <div>
                                {contact.lastMessage.is_system
                                    ? (
                                        <span className="lmc lmcExtra">{contact.lastMessage.sender_name}</span>
                                    )
                                    : (
                                        contact.lastMessage.sender_id === user.id
                                            ? <span>Вы:</span>
                                            : contact.is_group && <span>{contact.lastMessage.sender_name}:</span>
                                    )}
                                <span className={`lmc ${!contact.lastMessage.content || contact.lastMessage.is_system ? "lmcExtra" : ""}`}>
                                    {contact.lastMessage.content ? (
                                        partsLast && targetForLast ? (
                                            <span>
                                                {partsLast.before}{targetForLast.name || targetForLast.nick}{partsLast.after}
                                            </span>
                                        ) : (
                                            // Обычный текст (или пока грузится имя)
                                            <span>{contact.lastMessage.content}</span>
                                        )
                                    ) : contact.lastMessage.files?.length ?
                                        (`${contact.lastMessage.files.length} mediafile${contact.lastMessage.files.length > 1 ? "s" : ""}`)
                                        : (
                                            "Пересланное сообщение"
                                        )}
                                </span>
                            </div>
                            <span>{messageGetTime(contact.lastMessage.created_at)}</span>
                        </div>
                    )
                }
            </div>
        </div>
    )
}