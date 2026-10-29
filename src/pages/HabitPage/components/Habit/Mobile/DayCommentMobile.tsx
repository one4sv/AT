import { isMobile } from "react-device-detect";
import EmojiButton from "../../../../../components/ts/utils/EmojiButton";
import EmojiBar from "../../../../../components/ts/utils/EmojiBar";
import TA from "../../../../../components/ts/TA";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChatCenteredIcon, ClockCountdownIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { useDone } from "../../../../../components/hooks/DoneHook";
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
    const { sendDayComment, waitComAnswer } = useDone();
    const { dayComment, habit,  } = useTheHabit();
    const { chosenDay } = useCalendar();

    const [comment, setComment] = useState<string>("");
    const [syncing, setSyncing] = useState(true);
    const [ showEmojiBar, setShowEmojiBar ] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        setSyncing(true);
        setComment(dayComment || "");

        const t = setTimeout(() => {
            setSyncing(false);
        }, 50);

        return () => clearTimeout(t);
    }, [chosenDay, dayComment]);

  

    useEffect(() => { setShowEmojiBar(false); }, [open, chosenDay]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    };

    const cantSave =
        syncing || waitComAnswer ||
        !isMy ||
        !habit?.ongoing ||
        comment.trim() === (dayComment || "").trim();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isMobile && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (cantSave) return;
            sendDayComment(id, comment, chosenDay);
        }
    };

    const handleSave = () => {
        if (!cantSave) {
            sendDayComment(id, comment, chosenDay);
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
                    <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar} disabled={!isMy || !habit?.ongoing || syncing} />
                    <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar} setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef} />
                    <TA
                        placeholder="Комментарий"
                        taRef={textAreaRef}
                        readOnly={!isMy || (habit && !habit.ongoing)}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        value={comment}
                        maxLength={200}
                    />
                    <span>{comment.length}/200</span>
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