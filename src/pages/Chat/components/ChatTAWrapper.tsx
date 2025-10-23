import { Paperclip, SmileySticker, X } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useChat } from "../../../components/hooks/ChatHook";
import GetIconByType from "../utils/getIconByType";
import EmojiBar from "../../../components/ts/utils/emojiBar";

export function ChatTAWrapper() {
    const { sendMess, handleTyping } = useChat()
    const { contactId } = useParams()
    const [ mess, setMess ] = useState<string>("")
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false) 
    
    const inputFileRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

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
        if (contactId && (mess.trim() || files.length > 0)) {
            await sendMess(contactId, mess.trim(), files)
            setMess("")
            setFiles([])
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

    return (
        <div className="chatTAWrapper">
            <EmojiBar setText={setMess} setShowEmojiBar={setShowEmojiBar} taRef={textAreaRef} showEmojiBar={showEmojiBar}/>
            {files.length > 0 && (
                <div className="chatTAFiles">
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
                className={`chatTA ${files.length > 0 ? "chatTAwFiles" : ""}`}
                value={mess}
                ref={textAreaRef}
                onChange={(e) => { setMess(e.currentTarget.value); handleTyping(contactId!); }}
                onKeyDown={handleKeyDown}
            />
            <div className="chatTAMenu">
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
                <div className="chatTAbutt" onClick={() => setShowEmojiBar(!showEmojiBar)}>
                    <SmileySticker className="chatSvg" strokeWidth={2.5} width={24} height={24}/>
                </div>
                <div className="chatTAbutt" onClick={() => inputFileRef.current?.click()}>
                    <Paperclip className="chatSvg"/>
                </div>
                <div className="chatTAbutt" onClick={handleSend}>
                    <SendHorizontal className="chatSend" fill="currenColor"/>
                </div>
            </div>
        </div>
    )
}