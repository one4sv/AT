import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { Paperclip, PaperPlaneRightIcon, ArrowLeftIcon, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useDrop } from "../hooks/DropHook";
import type { Media } from "../context/ChatContext";
import EmojiButton from "./utils/EmojiButton";
import { isMobile } from "react-device-detect";
import TA from "./TA";
import MediaDraft from "./MediaDraft";
import EmojiBar from "./utils/EmojiBar";
import "../../scss/Composer.scss";

interface ComposerProps {
    text: string;
    setText: Dispatch<SetStateAction<string>>;
    files: File[];
    setFiles: Dispatch<SetStateAction<File[]>>;
    media?: Media[];
    setMedia?: Dispatch<SetStateAction<Media[]>>;
    placeholder: string;
    onSend: () => void;
    disabled?: boolean;
    sendLabel: string;
    onBack?: () => void;
    action?: ReactNode;
    reply?: { name: string; text: string } | null;
    onCancelReply?: () => void;
    inlineAttach?: boolean;
}

export default function Composer({
    text,
    setText,
    files,
    setFiles,
    media = [],
    setMedia,
    placeholder,
    onSend,
    disabled,
    sendLabel,
    onBack,
    action,
    reply,
    onCancelReply,
    inlineAttach = false
}: ComposerProps) {
    const { t } = useTranslation("acc");
    const { droppedFiles, setDroppedFiles } = useDrop();
    const [ writing, setWriting ] = useState(false);
    const expanded = !!reply || files.length > 0 || media.length > 0;
    useEffect(() => { if (reply) setWriting(true); }, [reply]);
    const composerRef = useRef<HTMLDivElement>(null);
    const [ showEmojiBar, setShowEmojiBar ] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const addFiles = (next: File[]) => { setWriting(true); setFiles(prev => [...prev, ...next]); };
    const removeFile = (index: number) => {
        if (index < media.length) setMedia?.(prev => prev.filter((_, i) => i !== index));
        else setFiles(prev => prev.filter((_, i) => i !== index - media.length));
    };
    const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(event.target.files || []));
        event.target.value = "";
    };

    useEffect(() => {
        if (!droppedFiles.length) return;
        if (!disabled) { setWriting(true); setFiles(prev => [...prev, ...droppedFiles]); }
        setDroppedFiles([]);
    }, [droppedFiles, disabled, setFiles, setDroppedFiles]);

    useEffect(() => {
        const element = composerRef.current;
        const page = element?.closest<HTMLElement>(".postPage");
        const bottom = element?.closest<HTMLElement>(".postCommentBottom");
        if (!page || !bottom) return;
        const measure = () => page.style.setProperty("--comment-bottom", `${bottom.offsetHeight + (parseFloat(bottom.style.bottom) || 0)}px`);
        const observer = new ResizeObserver(measure);
        observer.observe(bottom);
        window.addEventListener("composerresize", measure);
        measure();
        return () => {
            observer.disconnect();
            window.removeEventListener("composerresize", measure);
            page.style.removeProperty("--comment-bottom");
        };
    }, []);

    useEffect(() => {
        const closeOutside = (event: PointerEvent) => {
            const target = event.target as Element;
            if (composerRef.current?.contains(target) || target.closest(".emojiBar, .blackout")) return;
            taRef.current?.blur();
            setWriting(false);
            setShowEmojiBar(false);
        };
        document.addEventListener("pointerdown", closeOutside);
        return () => document.removeEventListener("pointerdown", closeOutside);
    }, []);

    const goBack = () => {
        if (showEmojiBar) setShowEmojiBar(false);
        else if (writing) {
            taRef.current?.blur();
            setWriting(false);
        } else onBack?.();
    };

    return (
        <div className={`composer ${writing ? "writing" : "reading"}`} ref={composerRef}>
            <div className="composerRow" ref={emojiRef}>
                {!inlineAttach && reply && <div className="composerReply">
                <div className="composerReplyInfo">
                    <span>{t("post.commentReplying", { name: reply.name })}</span>
                    <span>{reply.text}</span>
                </div>
                <button type="button" className="closeAnswer" onClick={onCancelReply} aria-label={t("post.commentCancel")}><X /></button>
            </div>}
                <button type="button" className="pageBottomBack" onClick={goBack} aria-label={t("navigation.back", { ns: "info" })}>
                    <ArrowLeftIcon />
                </button>
                {writing && !inlineAttach && <button type="button" className="composerAttach" disabled={disabled}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => fileRef.current?.click()} aria-label={t("post.attach")}>
                    <Paperclip />
                </button>}
                <div className={`composerInput inputWithEmoji ${inlineAttach && expanded ? "open" : ""} ${inlineAttach ? "composerChatStyle" : ""}`}>
                    {inlineAttach && reply && <div className="answerDiv">
                        <div className="answer">
                            <div className="answer1str">{t("post.commentReplying", { name: reply.name })}</div>
                            <div className="answer2str">{reply.text}</div>
                        </div>
                        <button type="button" className="closeAnswer" onClick={onCancelReply} aria-label={t("post.commentCancel")}><X /></button>
                    </div>}
                    {inlineAttach && <button type="button" className="composerInlineAttach" disabled={disabled} onPointerDown={event => event.preventDefault()} onClick={() => fileRef.current?.click()} aria-label={t("post.attach")}><Paperclip /></button>}
                    {(writing || inlineAttach) && <EmojiButton taRef={taRef} open={showEmojiBar} setOpen={setShowEmojiBar} disabled={disabled} />}
                    <div className="composerDraft" hidden={!writing}>
                    <MediaDraft
                        files={files}
                        media={media}
                        onRemove={removeFile}
                        disabled={disabled}
                    />
                    </div>
                    <TA
                        onFocus={() => setWriting(true)}
                        maxHeight={writing || inlineAttach ? 35 : 5}
                        taRef={taRef}
                        value={text}
                        onChange={event => setText(event.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        disabled={disabled}
                        onFiles={addFiles}
                        onSend={isMobile ? undefined : onSend}
                    />
                </div>
                {(writing || inlineAttach) ? <button
                    type="button"
                    className="chatWriteTAButt composerSend"
                    disabled={disabled || (!text.trim() && !files.length && !media.length)}
                    onMouseDown={event => event.preventDefault()}
                    onClick={onSend}
                    aria-label={sendLabel}
                >
                    <PaperPlaneRightIcon weight="fill" className="chatSend"/>
                </button> : <div className="composerAction">{action}</div>}
            </div>
            <EmojiBar
                taRef={taRef}
                setText={setText}
                showEmojiBar={showEmojiBar && !disabled}
                setShowEmojiBar={setShowEmojiBar}
                emojiRef={emojiRef}
                cn="composerEmoji"
            />
            <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                disabled={disabled}
                onChange={handleFiles}
            />
        </div>
    );
}
