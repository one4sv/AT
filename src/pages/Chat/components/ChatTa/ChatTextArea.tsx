import { useTranslation } from "react-i18next";
import TA from "../../../../components/ts/TA";
import MediaDraft from "../../../../components/ts/MediaDraft";
import { Paperclip, PaperPlaneRightIcon, X } from "@phosphor-icons/react";
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
import { useNote } from "../../../../components/hooks/NoteHook";
import EmojiButton from "../../../../components/ts/utils/EmojiButton";
interface FailedChatDraft {
    key: number;
    route: string;
    receiver: { nick?: string; id?: string };
    text: string;
    files: File[];
    answerId?: string;
    redirect?: message[];
    showNames: boolean;
}

const failedChatDrafts = new Map<string, FailedChatDraft[]>();
let nextFailedDraftId = 0;

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
    showEmojiBar,
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
        forwardPost,
        setForwardPost,
        forwardMedia,
        setForwardMedia,
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
    const { showNotification } = useNote();
    const { t } = useTranslation("acc");
    const { t: tc } = useTranslation("common");
    const sending = useRef(false);
    const routeRef = useRef("");
    const [oldMess, setOldMess] = useState<string>("");
    const [enterToSend, setEnterToSend] = useState(() => localStorage.getItem("at_chat_enter_to_send") !== "false");
    const [sendTypingStatus, setSendTypingStatus] = useState(() => localStorage.getItem("at_chat_send_typing") !== "false");
    const [files, setFiles] = useState<File[]>([]);
    const [oldFiles, setOldFiles] = useState<File[]>([]);
    const [oldMedia, setOldMedia] = useState<Media[]>([]);
    const location = useLocation();
    routeRef.current = location.pathname;
    const draftKey = `${user.id ?? "guest"}:${location.pathname}`;
    const [failedDrafts, setFailedDrafts] = useState<FailedChatDraft[]>(() => failedChatDrafts.get(draftKey) ?? []);
    const [retryingFailedId, setRetryingFailedId] = useState<number | null>(null);

    useEffect(() => {
        setFailedDrafts(failedChatDrafts.get(draftKey) ?? []);
        setRetryingFailedId(null);
    }, [draftKey]);
    useEffect(() => {
        const targetReady = !chatLoading && !!chatWith && (id
            ? chatWith.is_group && String(chatWith.id) === id
            : !chatWith.is_group && chatWith.nick === nick);
        if (!forwardMedia || forwardMedia.targetPath !== location.pathname || !targetReady) return;

        if (forwardMedia.isLink) {
            setMess(prev => [prev.trim(), forwardMedia.url].filter(Boolean).join("\n"));
            setForwardMedia(null);
            return;
        }

        const controller = new AbortController();
        const prepare = async () => {
            try {
                const response = await fetch(forwardMedia.url, {
                    credentials: "include",
                    signal: controller.signal
                });
                if (!response.ok) throw new Error("Media fetch failed");
                const blob = await response.blob();
                if (controller.signal.aborted) return;

                const file = new File([blob], forwardMedia.name || "media", {
                    type: forwardMedia.type || blob.type || "application/octet-stream"
                });
                setFiles(prev => [...prev, file]);
                setForwardMedia(null);
            } catch {
                if (controller.signal.aborted) return;
                showNotification("error", tc("chatUi.forwardMediaFailed"));
                setForwardMedia(null);
            }
        };

        void prepare();
        return () => controller.abort();
    }, [forwardMedia, location.pathname, chatLoading, chatWith, id, nick, setForwardMedia, setMess, showNotification, tc]);


    const removeFailedDraft = (key: number) => {
        const next = (failedChatDrafts.get(draftKey) ?? []).filter(draft => draft.key !== key);
        if (next.length) failedChatDrafts.set(draftKey, next);
        else failedChatDrafts.delete(draftKey);
        setFailedDrafts(next);
    };

    const retryFailedDraft = async (draft: FailedChatDraft) => {
        if (sending.current || retryingFailedId !== null) return;
        sending.current = true;
        setRetryingFailedId(draft.key);
        try {
            const success = await sendMess(
                draft.receiver,
                draft.text,
                draft.files,
                draft.answerId,
                draft.redirect,
                draft.showNames,
                confirmedMessages => {
                    if (routeRef.current !== draft.route) return;
                    setMessages(prev => {
                        const serverIds = new Set(confirmedMessages.map(message => message.id));
                        return [...prev.filter(message => !serverIds.has(message.id)), ...confirmedMessages];
                    });
                }
            );
            if (success) {
                const next = (failedChatDrafts.get(draftKey) ?? []).filter(item => item.key !== draft.key);
                if (next.length) failedChatDrafts.set(draftKey, next);
                else failedChatDrafts.delete(draftKey);
                if (routeRef.current === draft.route) setFailedDrafts(next);
            }
        } finally {
            sending.current = false;
            setRetryingFailedId(null);
        }
    };

    useEffect(() => {
        const syncKeyboard = (event: StorageEvent) => {
            if (event.key === "at_chat_enter_to_send") setEnterToSend(event.newValue !== "false");
            if (event.key === "at_chat_send_typing") setSendTypingStatus(event.newValue !== "false");
        };
        window.addEventListener("storage", syncKeyboard);
        return () => window.removeEventListener("storage", syncKeyboard);
    }, []);
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
        if (e.key !== "Enter" || isMobile || e.nativeEvent.isComposing) return;
        const send = enterToSend ? !e.shiftKey && !e.ctrlKey && !e.metaKey : e.ctrlKey || e.metaKey;
        if (send) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleSend = async () => {
        if (sending.current || forwardMedia?.targetPath === location.pathname) return;
        const currentPost = forwardPost;
        const currentRoute = location.pathname;
        const currentDraftKey = draftKey;
        const trimmedMess = [mess.trim(), currentPost ? new URL("/post/" + currentPost.id, window.location.origin).href : ""].filter(Boolean).join("\n\n");
        const hasContent = trimmedMess || files.length > 0 || editing && oldMedia.length > 0 || redirect;
        if (!(nick || id) || !hasContent) return;
        sending.current = true;
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
                setForwardPost(null);
                setShowNames(true);
                if (sendTypingStatus) stopTyping();
                const success = await sendMess(
                    {
                        nick,
                        id
                    },
                    trimmedMess,
                    currentFiles,
                    currentAnswer !== null ? currentAnswer.id : undefined,
                    currentRedirect,
                    currentShowNames,
                    confirmedMessages => {
                        if (routeRef.current !== currentRoute) return;

                        setMessages(prev => {
                            const serverIds = new Set(confirmedMessages.map(message => message.id));
                            const pendingIndex = prev.findIndex(message => message.id === tempId);
                            const confirmed = confirmedMessages.map((message, index) => ({
                                ...(prev.find(existing => existing.id === message.id) ?? message),
                                ...(index === 0 ? { clientId: tempId, animateIn: true } : {})
                            }));

                            if (pendingIndex === -1) {
                                const missing = confirmed.filter(message => !prev.some(existing => existing.id === message.id));
                                return missing.length ? [...prev, ...missing] : prev;
                            }

                            const next = prev.filter(message => message.id !== tempId && !serverIds.has(message.id));
                            const insertIndex = prev.slice(0, pendingIndex).filter(message => !serverIds.has(message.id)).length;
                            next.splice(insertIndex, 0, ...confirmed);
                            return next;
                        });
                    }
                );
                if (!success) {
                    // Если отправка не удалась — убираем временное сообщение
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    const failedDraft: FailedChatDraft = {
                        key: ++nextFailedDraftId,
                        route: currentRoute,
                        receiver: { nick, id },
                        text: trimmedMess,
                        files: currentFiles,
                        answerId: currentAnswer?.id,
                        redirect: currentRedirect,
                        showNames: currentShowNames
                    };
                    const next = [...(failedChatDrafts.get(currentDraftKey) ?? []), failedDraft];
                    failedChatDrafts.set(currentDraftKey, next);
                    if (routeRef.current === currentRoute) setFailedDrafts(next);
                }
            }
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);
            if (routeRef.current === currentRoute && currentPost) setForwardPost(currentPost);
        } finally {
            sending.current = false;
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
    const barOpen = forwardPost !== null || forwardMedia?.targetPath === location.pathname || files.length > 0 || answer !== null || editing !== null || redirect !== undefined;

    return (
        <>
            {failedDrafts.length > 0 && <div className="chatFailedDrafts">
                {failedDrafts.map(draft => (
                    <div className="chatFailedDraft" key={draft.key}>
                        <div className="chatFailedDraftContent">
                            <div>{tc("chatUi.failedMessage")}</div>
                            {draft.text && <div className="chatFailedDraftText">{draft.text}</div>}
                            {draft.files.length > 0 && <div className="chatFailedDraftFiles">{draft.files.map(file => file.name).join(", ")}</div>}
                        </div>
                        <div className="chatFailedDraftActions">
                            <button type="button" disabled={retryingFailedId !== null} onClick={() => retryFailedDraft(draft)}>{tc("chatUi.retryMessage")}</button>
                            <button type="button" disabled={retryingFailedId === draft.key} aria-label={tc("chatUi.discardFailedMessage")} onClick={() => removeFailedDraft(draft.key)}><X size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>}
            <div className="chatTAStr">
                <div className="chatTaButts">
                    <div className="chatWriteSvgButt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="chatSvg" />
                    </div>
                </div>
                <div className={`chatWriteBar inputWithEmoji ${barOpen ? "open" : ""}`} ref={emojiButtRef}>
                    {answer !== null && <MessBarBlock object={answer} scrollToMessage={scrollToMessage} />}
                    {editing !== null && <MessBarBlock object={editing} scrollToMessage={scrollToMessage} />}
                    {redirect !== undefined && <MessBarBlock
                        object={redirect?.length === 1 ? {
                            id: String(redirect[0].id),
                            sender: redirect[0].sender_name,
                            previewText: redirect[0].content.length > 0 ? redirect[0].content : redirect[0].files?.length ? `${redirect[0].files?.length} mediafile` : tc("chatUi.forwarded")
                        } : {
                            id: "0",
                            sender: [...new Set(redirect.filter(m => m.sender_name === m.sender_name).map(m => m.sender_name))].join(
                                ',  '
                            ),
                            previewText: tc("chatUi.forwardedCount", { count: redirect.length })
                        }}
                        scrollToMessage={scrollToMessage}
                    />}
                    {forwardPost && <div className="answerDiv postForwardDraft">
                        <div className="answer">
                            <div className="answer1str">{t("post.forward")}: {forwardPost.author}</div>
                            <div className="answer2str">{forwardPost.text || t("post.open")}</div>
                        </div>
                        <button type="button" className="closeAnswer" aria-label={t("editor.close")} onClick={() => setForwardPost(null)}>
                            <X />
                        </button>
                    </div>}
                    {forwardMedia?.targetPath === location.pathname && <div className="answerDiv postForwardDraft">
                        <div className="answer">
                            <div className="answer1str">{tc("chatMenu.forward")}</div>
                            <div className="answer2str">{forwardMedia.name}</div>
                        </div>
                        <button type="button" className="closeAnswer" aria-label={t("editor.close")} onClick={() => setForwardMedia(null)}>
                            <X />
                        </button>
                    </div>}
                    <MediaDraft files={files} media={oldMedia} onRemove={handleRemoveFile} />
                    <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar} />
                    <TA
                        name="chatTA"
                        id="chatTA"
                        className="chatTA chatTAwFiles"
                        value={mess}
                        taRef={textAreaRef}
                        onChange={e => {
                            setMess(e.currentTarget.value);
                            if (!editing && sendTypingStatus) handleTyping(chatWith ? chatWith.id : "");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={tc("chatUi.placeholder")}
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
