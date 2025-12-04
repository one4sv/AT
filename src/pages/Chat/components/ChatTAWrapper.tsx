import {  CaretDoubleDown, Paperclip, Prohibit, SmileySticker, X } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useChat } from "../../../components/hooks/ChatHook";
import GetIconByType from "../utils/getIconByType";
import EmojiBar from "../../../components/ts/utils/EmojiBar";
import { isMobile } from "react-device-detect";

export function ChatTAWrapper({showGoDown, handleGoDown} : { showGoDown:boolean, handleGoDown:()=> void}) {
    const { sendMess, handleTyping, chatWith } = useChat()
    const { nick } = useParams()
    const [ mess, setMess ] = useState<string>("")
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false) 
    const [ showChatBar, setShowChatBar ] = useState<boolean>(false)
    
    const inputFileRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const chatTARef = useRef<HTMLDivElement | null>(null)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (e.ctrlKey) {
                setMess(prev => prev + "\n")
            } else {
                e.preventDefault()
                handleSend()
            }
        }
    }
    const handleSend = async () => {
        if (nick && (mess.trim() || files.length > 0)) {
            await sendMess(nick, mess.trim(), files)
            setMess("")
            setFiles([])
            setShowChatBar(false)
        }
    }

    useEffect(() => {
        const ta = textAreaRef.current;
        if (!ta) return;

        ta.style.height = "auto";
        ta.style.minHeight = "10vh";

        const newHeight = ta.scrollHeight;
        ta.style.height = newHeight + "px";

        if (newHeight > window.innerHeight * 0.5) {
            ta.style.overflowY = "auto";
        } else {
            ta.style.overflowY = "hidden";
        }
    }, [mess]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                chatTARef.current &&
                !chatTARef.current.contains(e.target as Node) &&
                showChatBar
            ) {
                setShowChatBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showChatBar]);

    if (chatWith.am_i_blocked || chatWith.is_blocked) return (
        <div className="chatIsBlocked">
            {showGoDown && (
                <div className="goDown" onClick={handleGoDown}>
                    <CaretDoubleDown />
                </div>
            )}
            <Prohibit/>
            {chatWith.am_i_blocked ? <span>Данный пользователь заблокировал вас</span> : <span>Вы заблокировали данного пользователя</span>}
        </div>
    )

    return (
        <div className={`chatTAWrapper ${isMobile ? "mobile" : ""}`} ref={chatTARef}>
            {showGoDown && (
                <div className="goDown" onClick={handleGoDown}>
                    <CaretDoubleDown />
                </div>
            )}
            <EmojiBar setText={setMess} setShowEmojiBar={setShowEmojiBar} taRef={textAreaRef} showEmojiBar={showEmojiBar}/>
            {showChatBar && (
                <div className={`chatWriteBar ${files.length > 0 ? "chatBarwFiles" : ""}`}>
                    <div className="chatWriteSvgButt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="chatSvg"/>
                    </div>                    
                    <div className="chatWriteSvgButt" onClick={() => setShowEmojiBar(!showEmojiBar)}>
                        <SmileySticker className="chatSvg"/>
                    </div>
                    <div className="chatWriteTAButt" onClick={handleSend}>
                        <SendHorizontal className="chatSend" fill="currenColor"/>
                    </div>
                </div>
            )}
            {files.length > 0 && (
                <div className={`chatTAFiles ${showChatBar ? "chatTAFileswBar" : ""}`}>
                    {files.map((file, i) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const previewUrl = URL.createObjectURL(file);
                        return (
                            <div key={i} className="chatTAFile">
                                <div className="chatTAFileOverlay" onClick={() => {
                                    setFiles(prev => prev.filter((_, idx) => idx !== i));
                                }}>
                                    <X/>
                                </div>
                                {isImage ? (
                                    <img src={previewUrl} alt={file.name} className="chatTAFilePreview" />
                                ) : isVideo ? (
                                    <video src={previewUrl} className="chatTAFilePreview" controls />
                                ) : (
                                    <div className="chatTAFileOther">
                                    {GetIconByType(file.name, file.type)}
                                    <span className="chatTAFileName">{file.name}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <textarea
                name="chatTA"
                id="chatTA"
                className={`chatTA ${showChatBar || files.length > 0 ? "chatTAwFiles" : ""} ${isMobile ? "mobile" : ""}`}
                value={mess}
                ref={textAreaRef}
                onChange={(e) => { setMess(e.currentTarget.value); handleTyping(nick!); }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowChatBar(true)}
                placeholder="Напишите сообщение..."
            />
            <input
                type="file"
                multiple
                style={{ display: "none" }}
                ref={inputFileRef}
                onChange={(e) => {
                    if (!e.target.files) return;
                    setFiles(prev => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])]);
                }}
            />
        </div>
    )
}