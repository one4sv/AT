import { ClockCountdown, Paperclip, SmileySticker, X } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useLocation, useParams } from "react-router";
import { useChat } from "../../../../components/hooks/ChatHook";
import GetIconByType from "../../utils/getIconByType";
import { isMobile } from "react-device-detect";
import { useDrop } from "../../../../components/hooks/DropHook";
import { useMessages } from "../../../../components/hooks/MessagesHook";
import { MessBarBlock } from "../../utils/MessBarBlock";
import type { Media } from "../../../../components/context/ChatContext";
import { useSendMess } from "../../../../components/hooks/SendMessHook";

interface ChatTABgProps {
    textAreaRef: React.RefObject<HTMLTextAreaElement | null>, 
    scrollToMessage:(id:number) => void,
    mess:string,
    setMess:React.Dispatch<SetStateAction<string>>,
    showEmojiBar:boolean,
    setShowEmojiBar:React.Dispatch<SetStateAction<boolean>>,
    emojiButtRef:React.RefObject<HTMLDivElement | null>
}

export default function ChatTextArea({ textAreaRef, scrollToMessage, mess, setMess, setShowEmojiBar, emojiButtRef }: ChatTABgProps) {
    const { handleTyping, chatWith, chatLoading, stopTyping } = useChat()
    const { sendMess, editMess } = useSendMess()
    const { nick, id } = useParams()
    const { droppedFiles, setDroppedFiles } = useDrop()
    const { answer, editing, setEditing, redirect, setRedirect, showNames, setShowNames, setChosenMess } = useMessages()

    const [ oldMess, setOldMess ] = useState<string>("")
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ oldFiles, setOldFiles ] = useState<File[]>([])
    const [ oldMedia, setOldMedia ] = useState<Media[]>([])
    const [ sending, setSending ] = useState<boolean>(false)
    const location = useLocation();

    const inputFileRef = useRef<HTMLInputElement>(null)

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
        if (e.key === "Enter" && !e.shiftKey && !isMobile) {
            e.preventDefault()
            handleSend()
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
                        setChosenMess([])
                    }
                } else {
                    if (await sendMess({nick:nick, id:id}, trimmedMess, files, answer !== null ? answer.id : undefined, redirect, showNames)) {
                        setMess("")
                        setFiles([])
                        setChosenMess([])
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

        // Сбрасываем, чтобы корректно посчитать scrollHeight
        ta.style.height = "0px";
        ta.style.overflowY = "hidden";

        const minHeight = window.innerHeight * 0.05; // 5vh
        const maxHeight = window.innerHeight * 0.5;  // 50vh

        let newHeight = ta.scrollHeight;

        // Всегда не меньше 5vh
        if (newHeight < minHeight) {
            newHeight = minHeight;
        }

        // Ограничиваем максимумом
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            ta.style.overflowY = "auto";
        } else {
            ta.style.overflowY = "hidden";
        }

        ta.style.height = `${newHeight}px`;
    }, [mess]);

    useEffect(() => {
        setFiles([]);
    }, [nick]);

    useEffect(() => {
        if (location.pathname.startsWith("/chat") && droppedFiles?.length > 0 && (nick || id) && !chatLoading) {
            setFiles((prev) => [
                ...prev,
                ...droppedFiles.filter(f => f instanceof File && typeof f.type === 'string')
            ]);
            setDroppedFiles([])
        }
    }, [chatLoading, droppedFiles, id, location.pathname, nick, setDroppedFiles])

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedFiles = Array.from(e.clipboardData.files).filter(f => f instanceof File && typeof f.type === 'string');
        if (pastedFiles.length > 0) {
            e.preventDefault();
            setFiles(prev => [...prev, ...pastedFiles]);
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
        <>
            <div className={`chatWriteBar ${files.length > 0 ? "chatBarwFiles" : ""}`}>
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
            </div>
            {allFilesForDisplay.length > 0 && (
                <div className="chatTAFiles chatTAFileswBar">
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
            <div className="chatTAStr">
                <div className="chatTaButts">
                    <div className="chatWriteSvgButt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="chatSvg"/>
                    </div>                    
                    <div className="chatWriteSvgButt" ref={emojiButtRef} onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiBar(prev => !prev)}
                    }>
                        <SmileySticker className="chatSvg"/>
                    </div>
                </div>
                <textarea
                    name="chatTA"
                    id="chatTA"
                    className="chatTA chatTAwFiles"
                    value={mess}
                    ref={textAreaRef}
                    onChange={(e) => {
                        setMess(e.currentTarget.value)
                        if (!editing) handleTyping(chatWith ? chatWith.id : "")
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Напишите сообщение..."
                    onPaste={handlePaste}
                />
                <div className="chatTaButts">
                    <div className="chatWriteTAButt" onClick={handleSend}>
                        {sending ? (
                            <ClockCountdown className="chatSend"/>
                        ) : (
                            <SendHorizontal className="chatSend" fill="currenColor"/>
                        )}
                    </div>
                </div>
            </div>
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
        </>
    )
}