import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ArrowBendDownLeftIcon, ChatCenteredIcon, ClockCountdownIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import EmojiButton from "../../components/ts/utils/EmojiButton";
import EmojiBar from "../../components/ts/utils/EmojiBar";
import TA from "../../components/ts/TA";
import { ActivityPhoto,useActivityCommentPhotos } from "../../components/ts/ActivityCommentPhotos";
import { useUser } from "../../components/hooks/UserHook";

interface PlanCommentProps {
    planId: number;
    disabled?: boolean;
    mobile?: boolean;
    open?: "done" | "comment";
    setOpen?: Dispatch<SetStateAction<"done" | "comment">>;
}

export default function PlanComment({ planId, disabled = false, mobile = false, open = "comment", setOpen }: PlanCommentProps) {
    const { t } = useTranslation("common");
    const reduceMotion = useReducedMotion();
    const {user}=useUser();
    const photos=useActivityCommentPhotos(String(planId),"",true,!disabled,true);
    const [comment, setComment] = useState("");
    const loading=!photos.ready;
    const saving=photos.busy;
    const [showEmojiBar, setShowEmojiBar] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(()=>{setComment(photos.savedText ?? "");},[planId,photos.savedText]);

    useEffect(() => {
        setShowEmojiBar(false);
    }, [open]);

    const cantSave = saving || loading || disabled || (!photos.dirty && comment.trim()===(photos.savedText || "").trim());
    const save=async()=>{if(!cantSave)await photos.save(comment);};
    const others=photos.comments.filter(item=>item.user_id!==user.id);
    const otherComments=others.length>0 && <div className="planOtherComments">
        {others.map(item=><div key={item.user_id} className="planOtherComment">
            <div className="planOtherCommentAuthor">{item.user?.avatar_url && <img className="activityAvatar" src={item.user.avatar_url} alt=""/>}<span>{item.user?.username || item.user?.nick || t("plans.comment")}</span></div>
            {item.comment && <div>{item.comment}</div>}
            {!!item.photo_ids?.length && <div className="activityPhotoStrip">{item.photo_ids.map(key=><ActivityPhoto key={key} url={"/api/plans/"+planId+"/comment-photos/"+encodeURIComponent(key)}/>)}</div>}
        </div>)}
    </div>;
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
            <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar}
                setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef}/>
            <motion.div className="mobileCommentField" layout={!reduceMotion}
                transition={{ layout: { duration: .32, ease: [.22, .61, .36, 1] } }}>
                {photos.previews}
                <div className="mobileCommentInput inputWithEmoji">
                    <TA placeholder={t("habitPageUi.day.commentPlaceholder")} taRef={textAreaRef}
                        readOnly={loading || disabled || saving} value={comment} maxLength={200} minHeight={0} maxHeight={20}
                        onChange={event => setComment(event.target.value)} onKeyDown={handleKeyDown}/>
                    {photos.controls}
                    <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar}
                        disabled={loading || disabled || saving}/>
                    <span className="mobileCommentCount">{comment.length}/200</span>
                </div>
            </motion.div>
            <div className="hdcTAExtraMobile">
                <button className="saveCommentButtonMobile" type="button" disabled={cantSave} onClick={() => void save()}>
                    {saving ? <ClockCountdownIcon size={24}/> : <PaperPlaneRightIcon weight="fill" size={24}/>}
                </button>
            </div>
            {otherComments}
        </>}
    </div>;

    return <div className="planDesktopComment">
        <div className="habitDayComment inputWithEmoji" ref={emojiRef}>
            <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar}
                disabled={loading || disabled || saving}/>
            <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar}
                setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef}/>
            <TA placeholder={t("habitPageUi.day.commentPlaceholder")} taRef={textAreaRef}
                readOnly={loading || disabled || saving} value={comment} maxLength={200}
                onChange={event => setComment(event.target.value)} onKeyDown={handleKeyDown}/>
            {photos.previews}
            <div className="hdcTAExtra">
                <span><ArrowBendDownLeftIcon/> shift+enter</span>
                <div>
                    {photos.controls}
                    <span>{comment.length}/200</span>
                    <button className="saveCommentButton" type="button" disabled={cantSave} onClick={() => void save()}>
                        {saving ? <ClockCountdownIcon size={24}/> : <PaperPlaneRightIcon weight="fill" size={24}/>}
                    </button>
                </div>
            </div>
        </div>
        {otherComments}
    </div>;
}
