import { motion, useReducedMotion } from "motion/react";
import { useActivityCommentPhotos } from "../../../../../components/ts/ActivityCommentPhotos";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";
import EmojiButton from "../../../../../components/ts/utils/EmojiButton";
import EmojiBar from "../../../../../components/ts/utils/EmojiBar";
import TA from "../../../../../components/ts/TA";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChatCenteredIcon, ClockCountdownIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/DayComment.scss";

interface DayCommentProps {
    id: string;
    isMy: boolean;
    open: string;
    setOpen: Dispatch<SetStateAction<string>>
}

export default function DayCommentMobile({ id, isMy, open, setOpen }: DayCommentProps) {
    const { t } = useTranslation("common");
    const reduceMotion = useReducedMotion();

    const { dayComment, habit,  } = useTheHabit();
    const { chosenDay } = useCalendar();
    const visible=String(habit?.id)===id && !!(habit?.access?.is_member || habit?.access?.is_owner || isMy) &&
        (!habit?.access?.completion_start_date || chosenDay>=habit.access.completion_start_date);
    const photos=useActivityCommentPhotos(id,chosenDay,visible,visible && !!habit?.ongoing && isMy);
    const waitComAnswer=photos.busy;

    const [comment, setComment] = useState<string>("");
    const [syncing, setSyncing] = useState(true);
    const [ showEmojiBar, setShowEmojiBar ] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        setSyncing(true);
        setComment(photos.savedText ?? dayComment ?? "");

        const t = setTimeout(() => {
            setSyncing(false);
        }, 50);

        return () => clearTimeout(t);
    }, [id, chosenDay, photos.savedText, photos.ready ? undefined : dayComment]);

  

    useEffect(() => { setShowEmojiBar(false); }, [open, chosenDay]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    };

    const cantSave =
        syncing || waitComAnswer ||
        !isMy ||
        !habit?.ongoing ||
        (!photos.ready || (!photos.dirty && comment.trim() === (photos.savedText || "").trim()));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isMobile && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (cantSave) return;
            void photos.save(comment);
        }
    };

    const handleSave = () => {
        if (!cantSave) {
            void photos.save(comment);
        }
    };

    return (
        <div ref={emojiRef} className={`habitDayCommentMobile inputWithEmoji ${open === "comment" ? "open" : "close"}`}>
            {open === "done" ? (
                <div className="bottomOpen" onClick={() => setOpen("comment")}>
                    <ChatCenteredIcon size={22}/> 
                </div>
            ) : (
                <>
                    <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar} setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef} />
                    <motion.div className="mobileCommentField" layout={!reduceMotion}
                        transition={{ layout: { duration: .32, ease: [.22, .61, .36, 1] } }}>
                        {photos.previews}
                        <div className="mobileCommentInput inputWithEmoji">
                            <TA
                                placeholder={t("habitPageUi.day.commentPlaceholder")}
                                taRef={textAreaRef}
                                readOnly={!isMy || !habit?.ongoing || !photos.ready || photos.busy}
                                onChange={handleTextareaChange}
                                onKeyDown={handleKeyDown}
                                value={comment}
                                maxLength={200}
                                maxHeight={20}
                            />
                            {photos.controls}
                            <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar} disabled={!isMy || !habit?.ongoing || syncing} />
                            <span className="mobileCommentCount">{comment.length}/200</span>
                        </div>
                    </motion.div>
                    <div className="hdcTAExtraMobile">
                        <button
                            className="saveCommentButtonMobile"
                            disabled={cantSave  || waitComAnswer}
                            onClick={handleSave}
                        >
                            {waitComAnswer
                                ? <ClockCountdownIcon size={24}/>
                                : <PaperPlaneRightIcon weight="fill" size={24}/>
                            }
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}