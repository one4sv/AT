import { Heart, CheckCircle, ShareFat } from "@phosphor-icons/react";
import { reactionIcons } from "./ReactionsIcons"
import { useChat } from "../../../components/hooks/ChatHook";
import React, { useState } from "react";
import type { message } from "../../../components/context/ChatContext";
import { useUser } from "../../../components/hooks/UserHook";
import Linkify from "linkify-react";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useMessages } from "../../../components/hooks/MessagesHook";
import { Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router";
import AnswerMess from "./AnswerMess";
import MessageFiles from "./MessageFiles";

type MessageComponentType = {
    highlightedId?: number | null,
    message: message,
    messageRefs?: React.MutableRefObject<Map<number, HTMLDivElement | null>>,
    answer?:{id:number, name:string, text:string},
    redir_answer?:{id:number, name:string, text:string},
    scrollToMessage?:(id:number) => void,
    showNames?:(boolean),
    cornerType?: string | null,
}
export default function Message ({ highlightedId, message:m, messageRefs, answer, scrollToMessage, showNames, redir_answer, cornerType } : MessageComponentType) {
    const { setReaction, chatWith } = useChat()
    const { chosenMess, setChosenMess, isChose } = useMessages()
    const { user } = useUser()
    const { openMenu, menu } = useContextMenu()
    const [ showReactionButt, setShowReactionButt ] = useState<number>(0)
    
    const navigate = useNavigate()
    const messageGetTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const isMy = m.sender_id === user.id ? true : false

    return (
        <div
            className={`messageWrapper ${isChose ? "choosing" : ""} ${chosenMess.some(mess => mess.id === m.id) ? "chosen" : ""} ${highlightedId === m.id ? "highlight" : ""}
                ${cornerType ? `corner-${cornerType}` : ""}
                ${menu.point === "mess" && menu.options.id === String(m.id) && "onContextMenu"}
            `}
            ref={(el) => {messageRefs?.current.set(m.id, el)}}
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
                        isReacted, isMy:m.sender_id === user.id, text:m.content, previewText: m.content || (m.files && m.files?.length > 0 ? `${m.files?.length} mediafile` : "Пересланное сообщение"),
                        sender:m.sender_id === user.id ? user.username || user.nick! : chatWith.username || chatWith.nick!,
                        files:m.files || undefined,
                    }
                )
            }}

            onDoubleClick={(e) => {
                if (isChose) return;
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
                {!isMy && showNames && <div className="senderName" style={{cursor: isChose ? "default" : "pointer"}} onClick={() => !isChose && navigate(`/acc/${m.sender_nick}`)}>{m.sender_name}</div>}
                {answer && scrollToMessage && (
                    <AnswerMess answer={answer} scrollToMessage={scrollToMessage}/>
                )}
                <div className={`messageText ${isMobile ? "mobile" : ""}`}><Linkify>{m.content}</Linkify></div>
                {m.files && m.files.length > 0 && (
                    <MessageFiles files={m.files} m={m}/>
                )}
                {m.redirected_id && (
                    <div className="redirectedMess">
                        <div className="redirectSign"><ShareFat weight="fill"/>{`Переслано ${m.redirected_name ? "от" : ""}`}&nbsp;<span onClick={() => navigate(`/acc/${m.redirected_nick}`)}>{m.redirected_name}</span></div>
                        {m.redirected_answer && redir_answer && m.redirected_name && scrollToMessage && (
                            <AnswerMess answer={redir_answer} scrollToMessage={scrollToMessage}/>
                        )}
                        <div className="redirectText"><Linkify>{m.redirected_content}</Linkify></div>
                        {m.redirected_files && m.redirected_files.length > 0 && (
                            <MessageFiles files={m.redirected_files} m={m}/>
                        )}
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