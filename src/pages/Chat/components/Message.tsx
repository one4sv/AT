import { Heart, CheckCircle } from "@phosphor-icons/react";
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
import { useMessages } from "../../../components/hooks/MessagesHook";
import { Check, CheckCheck } from "lucide-react";
// import { Pen } from "lucide-react";

type MessageComponentType = {
    isMy: boolean,
    highlightedId: number | null,
    message: message,
    messageRefs: React.MutableRefObject<Map<number, HTMLDivElement | null>>,
    answer:{id:number, name:string, text:string} | undefined,
    scrollToMessage?:(id:number) => void,
}
export default function Message ({ isMy, highlightedId, message:m, messageRefs, answer, scrollToMessage } : MessageComponentType) {
    const { setReaction, chatWith } = useChat()
    const { setBlackout } = useBlackout()
    const { chosenMess, setChosenMess, isChose } = useMessages()
    const { user } = useUser()
    const { openMenu, menu } = useContextMenu()
    const [ showReactionButt, setShowReactionButt ] = useState<number>(0)

    const messageGetTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div
            className={`messageWrapper ${isChose ? "choosing" : ""} ${chosenMess.some(mess => mess.id === m.id) ? "chosen" : ""} ${highlightedId === m.id ? "highlight" : ""}
                ${menu.point === "mess" && menu.options.id === String(m.id) && "onContextMenu"}
            `}
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
                    if (chosenMess.some((mess) => mess.id === m.id )) setChosenMess((prev) => prev.filter(mess => mess.id !== m.id));
                    else setChosenMess((prev) => [...prev, { id:m.id, text:m.content}]);
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault()
                const isReacted = (() => {
                    const reaction = m.reactions.find(r => r.user_id === user.id);
                    return reaction ? reaction.reaction : "none";
                })();
                openMenu(e.clientX, e.clientY, "mess", { id:String(m.id)}, undefined, undefined,
                    {
                        isReacted, isMy:m.sender_id === user.id, text:m.content, previewText: m.content || `${m.files?.length} mediafile`, 
                        sender:m.sender_id === user.id ? user.username || user.nick! : chatWith.username || chatWith.nick!,
                        files:m.files || undefined,
                    }
                )
            }}

            onDoubleClick={(e) => {
                e.preventDefault()
                setReaction(m.id, "Heart")
            }}
        >
            {isChose && (
                <div className="messChoseButt" style={{opacity: isChose ? "1" : "0"}} onClick={() => {
                    if (chosenMess.some((mess) => mess.id === m.id)) { 
                        setChosenMess((prev) => prev.filter(mess => mess.id !== m.id))
                    }
                    else {
                        setChosenMess((prev) => [...prev, { id:m.id, text:m.content}])
                    }
                    
                }}>
                    {chosenMess.some((mess) => mess.id === m.id) ? <CheckCircle weight="fill"/> : <CheckCircle/> }
                </div>
            )}
            <div className={`message ${ isMy ? "my" : "ur"} ${isMobile ? "mobile" : ""}`}>
                {answer && scrollToMessage && (
                    <div className="answerMess" onClick={() => scrollToMessage(answer.id)}>
                        <div className="answerMess1str">
                            {answer.name}
                        </div>
                        <div className="answerMess2str">
                            {answer.text}
                        </div>
                    </div>
                )}
                <div className={`messageText ${isMobile ? "mobile" : ""}`}><Linkify>{m.content}</Linkify></div>
                {m.files && m.files.length > 0 && (
                    <div className="messageFiles">
                        {m.files.map((file, j) => {
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            return (
                                <div key={j} className="messageFile">
                                    {isImage ? (
                                        <img src={file.url} alt={file.name} className="messageFilePreview" onClick={() => setBlackout({seted:true, module:"ImgPrev", img:file.url})}
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            const isReacted = (() => {
                                                const reaction = m.reactions.find(r => r.user_id === user.id);
                                                return reaction ? reaction.reaction : "none";
                                            })();
                                            openMenu(e.clientX, e.clientY, "mess", { id:String(m.id), name:file.name, url:file.url }, undefined, undefined,
                                                { isReacted, isMy:m.sender_id === user.id, text:m.content, previewText: m.content || `${m.files?.length} mediafile`,
                                                sender:m.sender_id === user.id ? user.username || user.nick! : chatWith.username || chatWith.nick! }
                                            )
                                        }}/>
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
                <div className="messageStatusBarDiv">
                    <div className="messageBar">
                        <span className="messTime">{messageGetTime(m.created_at)}</span> 
                        {m.edited && (
                            <span className="editedMess">изменено</span>
                        )}
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
                    </div>
                    {isMy && 
                        (m.read_by.map(id => id.toString()).includes(chatWith.id) ? (
                            <div className="messageReadSign read"><CheckCheck/></div>
                        ) : (
                            <div className="messageReadSign unread"><Check/></div>
                        ))
                    }
                </div>
                {highlightedId === m.id && m.reactions && m.reactions.length === 0 ? (
                        <div 
                            className={`reactionButt ${isMy ? "myRB" : "urRB"}`}
                            style={{opacity: showReactionButt === m.id ? "1" : "0"}}
                            onClick={() => setReaction(m.id, "Heart")}
                        >
                            <Heart weight="fill" />
                        </div>
                    
                    )
                    : (showReactionButt === m.id && (!m.reactions || m.reactions.length === 0) && !isChose && (
                        <div 
                            className={`reactionButt ${isMy ? "myRB" : "urRB"}`}
                            onClick={() => setReaction(m.id, "Heart")}
                        >
                            <Heart weight="fill" />
                        </div>
                    ))
                }
            </div>
        </div>
    )
}