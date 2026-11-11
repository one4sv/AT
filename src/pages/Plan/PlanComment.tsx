import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ArrowBendDownLeftIcon, ChatCenteredIcon, ClockCountdownIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import EmojiButton from "../../components/ts/utils/EmojiButton";
import EmojiBar from "../../components/ts/utils/EmojiBar";
import TA from "../../components/ts/TA";
import { useNote } from "../../components/hooks/NoteHook";
import { api } from "../../components/ts/api";

interface PlanCommentProps {
    planId: number;
    disabled?: boolean;
    mobile?: boolean;
    open?: "done" | "comment";
    setOpen?: Dispatch<SetStateAction<"done" | "comment">>;
}

export default function PlanComment({ planId, disabled = false, mobile = false, open = "comment", setOpen }: PlanCommentProps) {
    const { t } = useTranslation("common");
    const { showNotification } = useNote();
    const [comment, setComment] = useState("");
    const [saved, setSaved] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showEmojiBar, setShowEmojiBar] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setComment("");
        setSaved("");
        void api.get("plans/" + planId + "/comment").then(response => {
            if (!active || !response.data?.success) return;
            setSaved(response.data.comment || "");
            setComment(response.data.comment || "");
        }).catch(() => {
            if (active) showNotification("error", t("plans.commentLoadError"));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
        // Per-plan fetch only: notification callbacks are recreated by the global notification context.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId]);

    useEffect(() => {
        setShowEmojiBar(false);
    }, [open]);

    const cantSave = saving || loading || disabled || comment.trim() === saved.trim();
    const save = async () => {
        if (cantSave) return;
        setSaving(true);
        try {
            const response = await api.post("plans/" + planId + "/comment", { comment });
            if (!response.data?.success) throw new Error();
            setSaved(response.data.comment || "");
        } catch {
            showNotification("error", t("plans.commentSaveError"));
        } finally {
            setSaving(false);
        }
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mobile && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void save();
        }
    };

    if (mobile) return <div className={"habitDayCommentMobile inputWithEmoji planDayCommentMobile " +
        (open === "comment" ? "open" : "close")} ref={emojiRef}>
        {open === "done" ? <button type="button" className="bottomOpen"
            aria-label={t("plans.comment")} onClick={() => setOpen?.("comment")}>
            <ChatCenteredIcon size={22}/>
        </button> : <>
            <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar}
                disabled={loading || disabled}/>
            <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar}
                setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef}/>
            <TA placeholder={t("habitPageUi.day.commentPlaceholder")} taRef={textAreaRef}
                readOnly={loading || disabled} value={comment} maxLength={200}
                onChange={event => setComment(event.target.value)} onKeyDown={handleKeyDown}/>
            <span>{comment.length}/200</span>
            <div className="hdcTAExtraMobile">
                <button className="saveCommentButtonMobile" type="button" disabled={cantSave} onClick={() => void save()}>
                    {saving ? <ClockCountdownIcon size={24}/> : <PaperPlaneRightIcon weight="fill" size={24}/>}
                </button>
            </div>
        </>}
    </div>;

    return <div className="planDesktopComment">
        <div className="habitDayComment inputWithEmoji" ref={emojiRef}>
            <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar}
                disabled={loading || disabled}/>
            <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar}
                setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef}/>
            <TA placeholder={t("habitPageUi.day.commentPlaceholder")} taRef={textAreaRef}
                readOnly={loading || disabled} value={comment} maxLength={200}
                onChange={event => setComment(event.target.value)} onKeyDown={handleKeyDown}/>
            <div className="hdcTAExtra">
                <span><ArrowBendDownLeftIcon/> shift+enter</span>
                <div>
                    <span>{comment.length}/200</span>
                    <button className="saveCommentButton" type="button" disabled={cantSave} onClick={() => void save()}>
                        {saving ? <ClockCountdownIcon size={24}/> : <PaperPlaneRightIcon weight="fill" size={24}/>}
                    </button>
                </div>
            </div>
        </div>
    </div>;
}
