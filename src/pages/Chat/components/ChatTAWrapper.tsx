import { Paperclip, SmileySticker, X } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import { Emojies, EmojiesGroups } from "../utils/emojies";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useChat } from "../../../components/hooks/ChatHook";
import GetIconByType from "../utils/getIconByType";

export function ChatTAWrapper() {
    const { sendMess, handleTyping } = useChat()
    const { contactId } = useParams()
    const [ mess, setMess ] = useState<string>("")
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false) 
    
    const emojiBarRef = useRef<HTMLDivElement | null>(null);
    const inputFileRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

    const handleAddEmoji = (emoji:string) => {
        const ta = textAreaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;

        setMess(prev => {
            const newValue = prev.slice(0, start) + emoji + prev.slice(end);
            requestAnimationFrame(() => {
                ta.focus();
                ta.selectionStart = ta.selectionEnd = start + emoji.length;
            });
            return newValue;
        });
    }
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

        // 👇 если больше 50vh — включаем прокрутку
        if (newHeight > window.innerHeight * 0.5) {
            ta.style.overflowY = "auto";
        } else {
            ta.style.overflowY = "hidden";
        }
    }, [mess]);


    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
            emojiBarRef.current &&
            !emojiBarRef.current.contains(e.target as Node) &&
            showEmojiBar
            ) {
            setShowEmojiBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiBar]);

    return (
        <div className="chatTAWrapper">
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
            {showEmojiBar && (
                <div className="emojiBar" ref={emojiBarRef}>
                    {EmojiesGroups.map((g, i) => (
                        <div className="emojiGroup" key={i}>
                            <div className="emojiGroupName">{g.value}</div>
                            <div className="emojiList">
                                {Emojies.filter(e => e.group === g.group).map((e, j) => (
                                    <div
                                        className="emoji"
                                        key={j}
                                        onClick={() => handleAddEmoji(e.pic)}
                                    >
                                        {e.pic}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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