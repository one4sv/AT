import { useEffect, useRef, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { Paperclip, PaperPlaneRightIcon, SmileySticker } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useDrop } from "../hooks/DropHook";
import type { Media } from "../context/ChatContext";
import PageBottom from "./PageBottom";
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
    action
}: ComposerProps) {
    const { t } = useTranslation("acc");
    const { droppedFiles, setDroppedFiles } = useDrop();
    const [ showEmojiBar, setShowEmojiBar ] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const addFiles = (next: File[]) => setFiles(prev => [...prev, ...next]);
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
        if (!disabled) setFiles(prev => [...prev, ...droppedFiles]);
        setDroppedFiles([]);
    }, [droppedFiles, disabled, setFiles, setDroppedFiles]);

    return (
        <div className="composer">
            <div className="composerRow" ref={emojiRef}>
                <div className="chatTaButts">
                    <div
                        className="chatWriteSvgButt"
                        onClick={() => fileRef.current?.click()}
                        aria-label={t("post.attach")}
                    >
                        <Paperclip />
                    </div>
                    <div
                        className="chatWriteSvgButt"
                        onClick={() => setShowEmojiBar(!showEmojiBar)}
                        aria-label={t("post.emoji")}
                    >
                        <SmileySticker />
                    </div>
                </div>
                <div className="composerInput">
                    <MediaDraft
                        files={files}
                        media={media}
                        onRemove={removeFile}
                        disabled={disabled}
                    />
                    <TA
                        taRef={taRef}
                        value={text}
                        onChange={event => setText(event.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        disabled={disabled}
                        onFiles={addFiles}
                        onSend={onSend}
                    />
                </div>
                <div
                    className="chatWriteTAButt"
                    onClick={onSend}
                    aria-label={sendLabel}
                >
                    <PaperPlaneRightIcon weight="fill" className="chatSend"/>
                </div>
            </div>
            <EmojiBar
                taRef={taRef}
                setText={setText}
                showEmojiBar={showEmojiBar && !disabled}
                setShowEmojiBar={setShowEmojiBar}
                emojiRef={emojiRef}
                cn="composerEmoji"
            />
            <PageBottom className="composerTools" onBack={onBack}>
                {action}
            </PageBottom>
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
