import { Check, Heart, Checks } from "@phosphor-icons/react";
import { reactionIcons } from "./ReactionsIcons"
import { useChat } from "../../../components/hooks/ChatHook";
import { useState } from "react";
import type { message } from "../../../components/context/ChatContext";
import { useUser } from "../../../components/hooks/UserHook";
import { useParams } from "react-router-dom";
import GetIconByType from "../utils/getIconByType";

type MessageComponentType = {
    isMy: boolean,
    highlightedId: number | null,
    message: message,
    messageRefs: React.MutableRefObject<Map<number, HTMLDivElement | null>>
}
export default function Message ({ isMy, highlightedId, message:m, messageRefs } : MessageComponentType) {
    const { setReaction, chatWith } = useChat()
    const { user } = useUser()
    const { contactId } = useParams()
    
    const [ showReactionButt, setShowReactionButt ] = useState<number>(0)

    const messageGetTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return (
        <div
            className="messageWrapper"
            ref={(el) => {messageRefs.current.set(m.id, el)}}
            onMouseEnter={() => setShowReactionButt(m.id)}
            onMouseLeave={() => setShowReactionButt(0)}
            onMouseDown={(e) => {
                if (e.detail === 2) { // двойной клик
                const el = e.currentTarget;
                el.style.userSelect = "none"; // временно блокируем выделение
                setTimeout(() => {
                    el.style.userSelect = "text"; // возвращаем обратно через 300мс
                }, 300);
                }
            }}
            onDoubleClick={(e) => {
                e.preventDefault()
                setReaction(m.id, "Heart")
            }}
        >
            <div className={`message ${ isMy ? "my" : "ur"} ${highlightedId === m.id ? "highlight" : ""}`}>
                <div className="messageText">{m.content}</div>
                {m.files && m.files.length > 0 && (
                    <div className="messageFiles">
                        {m.files.map((file, j) => {
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={j} className="messageFile">
                                    {isImage ? (
                                        <img src={file.url} alt={file.name} className="messageFilePreview" />
                                    ) : isVideo ? (
                                        <video src={file.url} className="messageFilePreview" controls />
                                    ) : (
                                        <a href={file.url} download={file.name} className="messageFileOther">
                                            {GetIconByType(file.name, file.type)}
                                            <span className="messageFileName">{file.name}</span>
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="messageDate">
                    {showReactionButt === m.id && (!m.reactions || m.reactions.length === 0) && (
                        <div 
                            className={`reactionButt ${isMy ? "myRB" : "urRB"}`}
                            onClick={() => setReaction(m.id, "Heart")}
                        >
                            <Heart weight="fill" />
                        </div>
                    )}
                    {!isMy && messageGetTime(m.created_at)}
                    {m.reactions && m.reactions.length > 0 && (
                        <div className="reactions" onClick={()=> setReaction(m.id, "Heart")}>
                            {Object.entries(
                                m.reactions.reduce((acc, r) => {
                                    if (!acc[r.reaction]) acc[r.reaction] = [];
                                    acc[r.reaction].push(r.user_id);
                                    return acc;
                                }, {} as Record<string, string[]>)
                            ).map(([reaction, users]) => (
                                <div key={reaction} className={`reactionItem ${isMy ? "myR" : "urR"}`}>
                                    {reactionIcons[reaction]}
                                    <div className="reactionUsers">
                                        {users.slice(0, 2).map((userId) => {
                                            const src = userId === user.id ? user.avatar_url : chatWith.avatar_url;
                                            return (
                                                <div key={userId} className="reactionUser">
                                                    <img src={src!} alt="" />
                                                </div>
                                            );
                                        })}
                                        {users.length > 2 && <span>+{users.length - 2}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {isMy && messageGetTime(m.created_at)}
                    {isMy && 
                        (m.read_by.map(id => id.toString()).includes(contactId!) ? (
                            <div className="messageUnread"><Checks/></div>
                        ) : (
                            <div className="messageUnread"><Check/></div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}