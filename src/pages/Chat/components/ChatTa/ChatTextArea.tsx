import TA from "../../../../components/ts/TA";
import MediaDraft from "../../../../components/ts/MediaDraft";
import { Paperclip, PaperPlaneRightIcon, SmileySticker } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { useLocation, useParams } from "react-router";
import { useChat } from "../../../../components/hooks/ChatHook";
import { isMobile } from "react-device-detect";
import { useDrop } from "../../../../components/hooks/DropHook";
import { useMessages } from "../../../../components/hooks/MessagesHook";
import { MessBarBlock } from "../../utils/MessBarBlock";
import type { Media, message } from "../../../../components/context/ChatContext";
import { useSendMess } from "../../../../components/hooks/SendMessHook";
import { useUser } from "../../../../components/hooks/UserHook";
interface ChatTABgProps {
    textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
    scrollToMessage: (id: number) => void;
    mess: string;
    setMess: React.Dispatch<SetStateAction<string>>;
    showEmojiBar: boolean;
    setShowEmojiBar: React.Dispatch<SetStateAction<boolean>>;
    emojiButtRef: React.RefObject<HTMLDivElement | null>;
}
export default function ChatTextArea({
    textAreaRef,
    scrollToMessage,
    mess,
    setMess,
    setShowEmojiBar,
    emojiButtRef
}: ChatTABgProps) {
    const {
        handleTyping,
        chatWith,
        chatLoading,
        stopTyping,
        setMessages
    } = useChat();
    const {
        sendMess,
        editMess
    } = useSendMess();
    const {
        nick,
        id
    } = useParams();
    const {
        droppedFiles,
        setDroppedFiles
    } = useDrop();
    const {
        answer,
        editing,
        setEditing,
        redirect,
        setRedirect,
        showNames,
        setShowNames,
        setChosenMess
    } = useMessages();
    const { user } = useUser();
    const [oldMess, setOldMess] = useState<string>("");
    const [files, setFiles] = useState<File[]>([]);
    const [oldFiles, setOldFiles] = useState<File[]>([]);
    const [oldMedia, setOldMedia] = useState<Media[]>([]);
    const location = useLocation();
    const inputFileRef = useRef<HTMLInputElement>(null);

    useEffect(
        () => {
            if (editing !== null) {
                setOldMess(mess);
                setOldFiles(files);
                setMess(editing.text || "");
                setFiles([]);
                setOldMedia(editing.media ?? []);
            } else {
                setMess(oldMess);
                setFiles(oldFiles);
                setOldMedia([]);
            }
        },
        [editing]
    );
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isMobile && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleSend = async () => {
        const trimmedMess = mess.trim();
        const hasContent = trimmedMess || files.length > 0 || editing && oldMedia.length > 0 || redirect;
        if (!(nick || id) || !hasContent) return;
        // Сохраняем текущие значения перед очисткой
        const currentFiles = [...files];
        const currentAnswer = answer;
        const currentRedirect = redirect;
        const currentShowNames = showNames;
        try {
            if (editing !== null) {
                const keptUrls = oldMedia.map(m => m.url);
                if ((await editMess(Number(editing.id), trimmedMess, files, keptUrls, answer !== null ? answer.id : undefined)) === true) {
                    setEditing(null);
                    setChosenMess([]);
                }
            } else {
                const tempId = -Date.now();
                const tempMessage: message = {
                    id: tempId,
                    clientId: tempId,
                    animateIn: true,
                    sender_id: user.id ?? "You",
                    sender_name: user.username || user.username || "You",
                    sender_nick: user.nick || "",
                    sender_avatar_url: user.avatar_url || "",
                    content: trimmedMess,
                    created_at: new Date(),
                    files: currentFiles.map(
                        f => ({
                            url: URL.createObjectURL(f),
                            name: f.name,
                            type: f.type,
                            message_id: String(tempId)
                        })
                    ),
                    read_by: [],
                    reactions: [],
                    answer_id: currentAnswer ? Number(currentAnswer.id) : null,
                    edited: false,
                    redirected_id: null,
                    is_system: false,
                    is_pinned: false,
                    target_id: null,
                    isPending: true
                };
                setMessages(prev => [...prev, tempMessage]);
                // Очищаем поле сразу
                setMess("");
                setFiles([]);
                setChosenMess([]);
                setRedirect(undefined);
                setShowNames(true);
                stopTyping();
                const success = await sendMess(
                    {
                        nick,
                        id
                    },
                    trimmedMess,
                    currentFiles,
                    currentAnswer !== null ? currentAnswer.id : undefined,
                    currentRedirect,
                    currentShowNames
                );
                if (!success) {
                    // Если отправка не удалась — убираем временное сообщение
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                }
            }
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);
            // Можно дополнительно удалить temp-сообщение при ошибке
        }
    };



    useEffect(() => {
        setFiles([]);
    }, [nick]);

    useEffect(
        () => {
            if (location.pathname.startsWith("/chat") && droppedFiles?.length > 0 && (nick || id) && !chatLoading) {
                setFiles(
                    prev => [...prev, ...droppedFiles.filter(f => f instanceof File && typeof f.type === 'string')]
                );
                setDroppedFiles([]);
            }
        },
        [chatLoading, droppedFiles, id, location.pathname, nick, setDroppedFiles]
    );
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedFiles = Array.from(e.clipboardData.files).filter(f => f instanceof File && typeof f.type === 'string');
        if (pastedFiles.length > 0) {
            if (!e.clipboardData.getData("text/plain")) e.preventDefault();
            setFiles(prev => [...prev, ...pastedFiles]);
        }
    };
    const handleRemoveFile = (index: number) => {
        if (index < oldMedia.length) {
            setOldMedia(prev => prev.filter((_, i) => i !== index));
        } else {
            setFiles(prev => prev.filter((_, i) => i !== index - oldMedia.length));
        }
    };
    const barOpen = files.length > 0 || answer !== null || editing !== null || redirect !== undefined;

    return (
        <>
            <div className="chatTAStr">
                <div className="chatTaButts">
                    <div className="chatWriteSvgButt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="chatSvg" />
                    </div>
                    <div
                        className="chatWriteSvgButt"
                        ref={emojiButtRef}
                        onClick={e => {
                            e.stopPropagation();
                            setShowEmojiBar(prev => !prev);
                        }}
                    >
                        <SmileySticker className="chatSvg" />
                    </div>
                </div>
                <div className={`chatWriteBar ${barOpen ? "open" : ""}`}>
                    {answer !== null && <MessBarBlock object={answer} scrollToMessage={scrollToMessage} />}
                    {editing !== null && <MessBarBlock object={editing} scrollToMessage={scrollToMessage} />}
                    {redirect !== undefined && <MessBarBlock
                        object={redirect?.length === 1 ? {
                            id: String(redirect[0].id),
                            sender: redirect[0].sender_name,
                            previewText: redirect[0].content.length > 0 ? redirect[0].content : redirect[0].files?.length ? `${redirect[0].files?.length} mediafile` : "Пересланное сообщение"
                        } : {
                            id: "0",
                            sender: [...new Set(redirect.filter(m => m.sender_name === m.sender_name).map(m => m.sender_name))].join(
                                ',  '
                            ),
                            previewText: `${redirect.length} сообщения`
                        }}
                        scrollToMessage={scrollToMessage}
                    />}
                    <MediaDraft files={files} media={oldMedia} onRemove={handleRemoveFile} />
                    <TA
                        name="chatTA"
                        id="chatTA"
                        className="chatTA chatTAwFiles"
                        value={mess}
                        taRef={textAreaRef}
                        onChange={e => {
                            setMess(e.currentTarget.value);
                            if (!editing) handleTyping(chatWith ? chatWith.id : "");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Напишите сообщение..."
                        onPaste={handlePaste}
                    />
                </div>
                <div className="chatWriteTAButt" onClick={handleSend}>
                    <PaperPlaneRightIcon className="chatSend" weight="fill" />
                </div>
            </div>
            <input
                type="file"
                multiple
                style={{
                    display: "none"
                }}
                ref={inputFileRef}
                onChange={e => {
                    if (!e.target.files) return;
                    const selectedFiles = Array.from(e.target.files).filter(f => f instanceof File && typeof f.type === 'string');
                    setFiles(prev => [...prev, ...selectedFiles]);
                    e.target.value = "";
                }}
            />
        </>
    );
}
