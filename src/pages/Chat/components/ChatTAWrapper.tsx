import { CaretDoubleDown, ClockCountdown, Paperclip, Prohibit, SmileySticker, Sticker, X } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import { useChat } from "../../../components/hooks/ChatHook";
import GetIconByType from "../utils/getIconByType";
import EmojiBar from "../../../components/ts/utils/EmojiBar";
import { isMobile } from "react-device-detect";
import { useDrop } from "../../../components/hooks/DropHook";
import { useMessages } from "../../../components/hooks/MessagesHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { MessBarBlock } from "../utils/MessBarBlock";
import type { Media } from "../../../components/context/ChatContext";
import { useSendMess } from "../../../components/hooks/SendMessHook";

export function ChatTAWrapper({showGoDown, handleGoDown, scrollToMessage} : { showGoDown:boolean, handleGoDown:()=> void, scrollToMessage:(id:number) => void}) {
    const { handleTyping, chatWith, chatLoading, stopTyping } = useChat()
    const { sendMess, editMess } = useSendMess()
    const { nick, id } = useParams()
    const { droppedFiles, setDroppedFiles } = useDrop()
    const { answer, editing, setEditing, redirect, setRedirect, showNames, setShowNames } = useMessages()
    const { menuRef } = useContextMenu()

    const [ mess, setMess ] = useState<string>("")
    const [ oldMess, setOldMess ] = useState<string>("") //сохранить текст до редактирования
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ oldFiles, setOldFiles ] = useState<File[]>([]) // сохр файлы до редактирования
    const [ oldMedia, setOldMedia ] = useState<Media[]>([])
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false) 
    const [ showChatBar, setShowChatBar ] = useState<boolean>(false)
    const [ sending, setSending ] = useState<boolean>(false)
    const location = useLocation();
    
    const inputFileRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const chatTARef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (editing !== null) {
            setOldMess(mess)
            setOldFiles(files)
            setMess(editing.text || "")
            setFiles([])
            setOldMedia(editing.media ?? [])
        } else {
            setMess(oldMess)
            setFiles(oldFiles)
            setOldMedia([])
        }
    }, [editing])


    const allFilesForDisplay = [
        ...oldMedia.map(m => ({ file: m, isOld: true })),
        ...files.map(f => ({ file: f, isOld: false })),
    ] as { file: Media | File; isOld: boolean }[];

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
        const trimmedMess = mess.trim();
        const hasContent = trimmedMess || files.length > 0 || (editing && oldMedia.length > 0) || redirect;
        if ((nick || id) && hasContent) {
            setSending(true);
            try {
                if (editing !== null) {
                    const keptUrls = oldMedia.map(m => m.url);
                    if (await editMess(Number(editing.id), trimmedMess, files, keptUrls, answer !== null ? answer.id : undefined) === true) {
                        setEditing(null);
                    }
                } else {
                    if (await sendMess({nick:nick, id:id}, trimmedMess, files, answer !== null ? answer.id : undefined, redirect, showNames)) {
                        setMess("")
                        setFiles([])
                        setRedirect(undefined)
                        setShowNames(true)
                        stopTyping()
                    }
                }
            } catch (error) {
                console.error("Ошибка при отправке сообщения:", error);
            } finally {
                setSending(false);
            }
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
        if (answer !== null || editing !== null || redirect !== undefined) setShowChatBar(true);

        const handleClickOutside = (e: MouseEvent) => {
            if (e.button === 2 || !chatTARef.current || answer !== null || editing !== null || redirect !== undefined) return;

            if (menuRef.current === null) {
                if (
                    !chatTARef.current.contains(e.target as Node) &&
                    showChatBar
                ) {
                    setShowChatBar(false);
                }
                return;
            }
            if (
                !menuRef.current.contains(e.target as Node) &&
                !chatTARef.current.contains(e.target as Node) &&
                showChatBar
            ) {
                setShowChatBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [answer, menuRef, editing, showChatBar, redirect]);


    useEffect(() => {
        setFiles([]);
    }, [nick]);

    useEffect(() => {
        if (location.pathname.startsWith("/chat") && droppedFiles?.length > 0 && (nick || id) && !chatLoading) {
            setShowChatBar(true)
            setFiles((prev) => [
                ...prev,
                ...droppedFiles.filter(f => f instanceof File && typeof f.type === 'string')
            ]);
            setDroppedFiles([])
        }
    }, [chatLoading, droppedFiles, location.pathname, nick, setDroppedFiles])

    if (chatWith && (chatWith.am_i_blocked || chatWith.is_blocked)) return (
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
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedFiles = Array.from(e.clipboardData.files).filter(f => f instanceof File && typeof f.type === 'string');
        if (pastedFiles.length > 0) {
            e.preventDefault();
            setFiles(prev => [...prev, ...pastedFiles]);
            setShowChatBar(true);
        }
    }

    const handleRemoveFile = (index: number) => {
        if (index < oldMedia.length) {
            setOldMedia(prev => prev.filter((_, i) => i !== index));
        } else {
            setFiles(prev => prev.filter((_, i) => i !== index - oldMedia.length));
        }
    };

    function isOldMedia(item: typeof allFilesForDisplay[number]): item is { file: Media; isOld: true } {
        return item.isOld === true;
    }


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
                    <div className="chatWriteSvgButt">
                        <Sticker className="chatSvg"/>
                    </div>
                    {answer !== null && (
                        <MessBarBlock object={answer} scrollToMessage={scrollToMessage} />
                    )}
                    {editing !== null && (
                        <MessBarBlock object={editing} scrollToMessage={scrollToMessage} />
                    )}
                    {redirect !== undefined && (
                        <MessBarBlock object={redirect?.length === 1 ? 
                            { id:String(redirect[0].id) , sender:redirect[0].sender_name, 
                                previewText:redirect[0].content.length > 0
                                    ? redirect[0].content
                                    : redirect[0].files?.length 
                                        ? `${redirect[0].files?.length} mediafile`
                                        :"Пересланное сообщение"} 
                            : { id:"0", sender:[...new Set(redirect.filter(m => m.sender_name === m.sender_name).map(m => m.sender_name))].join(',  '), previewText:`${redirect.length} сообщения`}} 
                        scrollToMessage={scrollToMessage} />
                    )}
                    <div className="chatWriteTAButt" onClick={handleSend}>
                        {sending ? (
                            <ClockCountdown className="chatSend"/>
                        ) : (
                            <SendHorizontal className="chatSend" fill="currenColor"/>
                        )}
                    </div>
                </div>
            )}
            {allFilesForDisplay.length > 0 && (
                <div className={`chatTAFiles ${showChatBar ? "chatTAFileswBar" : ""}`}>
                    {allFilesForDisplay.map((item, i) => {
                        const { file } = item;
                        const isImage = isOldMedia(item)
                            ? (file as Media).url?.match(/\.(png|jpe?g|gif|webp)$/i)
                            : (file as File).type?.startsWith("image/") ?? false;
                        const isVideo = isOldMedia(item)
                            ? (file as Media).url?.match(/\.(mp4|webm|ogg)$/i)
                            : (file as File).type?.startsWith("video/") ?? false;
                        const name = file.name ?? 'unknown';

                        let previewUrl: string | undefined;
                        if (isImage || isVideo) {
                            previewUrl = isOldMedia(item)
                                ? (file as Media).url
                                : URL.createObjectURL(file as File);
                        }

                        return (
                            <div key={i} className="chatTAFile">
                                <div className="chatTAFileOverlay" onClick={() => handleRemoveFile(i)}>
                                    <X />
                                </div>
                                {isImage ? (
                                    <img src={previewUrl} alt={name} className="chatTAFilePreview" />
                                ) : isVideo ? (
                                    <video src={previewUrl} className="chatTAFilePreview" controls />
                                ) : (
                                    <div className="chatTAFileOther">
                                        {GetIconByType(name, (file as Media | File).type ?? '')}
                                        <span className="chatTAFileName">{name}</span>
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
                onChange={(e) => {
                    setMess(e.currentTarget.value)
                    if (!editing) handleTyping(chatWith ? chatWith.id : "")
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowChatBar(true)}
                placeholder="Напишите сообщение..."
                onPaste={handlePaste}
            />
            <input
                type="file"
                multiple
                style={{ display: "none" }}
                ref={inputFileRef}
                onChange={(e) => {
                    if (!e.target.files) return;
                    const selectedFiles = Array.from(e.target.files).filter(f => f instanceof File && typeof f.type === 'string');
                    setFiles(prev => [...prev, ...selectedFiles]);
                }}
            />
        </div>
    )
}