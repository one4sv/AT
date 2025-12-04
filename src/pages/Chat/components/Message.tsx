import { Check, Heart, Checks, CheckCircle } from "@phosphor-icons/react";
import { reactionIcons } from "./ReactionsIcons"
import { useChat } from "../../../components/hooks/ChatHook";
import React, { useState } from "react";
import type { message } from "../../../components/context/ChatContext";
import { useUser } from "../../../components/hooks/UserHook";
import GetIconByType from "../utils/getIconByType";
import Linkify from "linkify-react";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";

type MessageComponentType = {
    isMy: boolean,
    highlightedId: number | null,
    message: message,
    messageRefs: React.MutableRefObject<Map<number, HTMLDivElement | null>>,
    isChose:boolean,
    setIsChose:React.Dispatch<React.SetStateAction<boolean>>,
    chosenMess:number[],
    setChosenMess: React.Dispatch<React.SetStateAction<number[]>>,
}
export default function Message ({ isMy, highlightedId, message:m, messageRefs, isChose, setIsChose, chosenMess, setChosenMess } : MessageComponentType) {
    const { setReaction, chatWith } = useChat()
    const { setBlackout } = useBlackout()
    const { user } = useUser()
    const { openMenu } = useContextMenu()
    const [ showReactionButt, setShowReactionButt ] = useState<number>(0)

    const messageGetTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div
            className={`messageWrapper ${isChose ? "choosing" : ""} ${chosenMess.includes(m.id) ? "chosen" : ""} `}
            ref={(el) => {messageRefs.current.set(m.id, el)}}
            onMouseEnter={() => setShowReactionButt(m.id)}
            onMouseLeave={() => setShowReactionButt(0)}
            onMouseDown={(e) => {
                if (e.detail === 2) {
                const el = e.currentTarget;
                el.style.userSelect = "none";
                setTimeout(() => {
                    el.style.userSelect = "text";
                }, 300);
                }
            }}
            onClick={() => {
                if (isChose) {
                    if (chosenMess.includes(m.id)) setChosenMess((prev) => prev.filter(id => id !== m.id));
                    else setChosenMess((prev) => [...prev, m.id]);
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault()
                const isReacted = (() => {
                    const reaction = m.reactions.find(r => r.user_id === user.id);
                    return reaction ? reaction.reaction : "none";
                })();
                openMenu(e.clientX, e.clientY, "mess", { id:String(m.id)}, undefined, undefined,
                    { isChose, setIsChose, setMess:setChosenMess, chosenMess, isReacted }
                )
            }}

            onDoubleClick={(e) => {
                e.preventDefault()
                setReaction(m.id, "Heart")
            }}
        >
            {isChose && (
                <div className="messChoseButt" style={{opacity: isChose ? "1" : "0"}} onClick={() => {
                    if (chosenMess.includes(m.id)) setChosenMess((prev) => prev.filter(id => id !== m.id));
                    else setChosenMess((prev) => [...prev, m.id]);
                    
                }}>
                    {chosenMess.includes(m.id) ? <CheckCircle weight="fill"/> : <CheckCircle/> }
                </div>
            )}
            <div className={`message ${ isMy ? "my" : "ur"} ${highlightedId === m.id ? "highlight" : ""} ${isMobile ? "mobile" : ""}`}>
                <div className={`messageText ${isMobile ? "mobile" : ""}`}><Linkify>{m.content}</Linkify></div>
                {m.files && m.files.length > 0 && (
                    <div className="messageFiles">
                        {m.files.map((file, j) => {
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={j} className="messageFile">
                                    {isImage ? (
                                        <img src={file.url} alt={file.name} className="messageFilePreview" onClick={() => setBlackout({seted:true, module:"ImgPrev", img:file.url})}/>
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
                    {showReactionButt === m.id && (!m.reactions || m.reactions.length === 0) && !isChose && (
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
                        (m.read_by.map(id => id.toString()).includes(chatWith.id) ? (
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