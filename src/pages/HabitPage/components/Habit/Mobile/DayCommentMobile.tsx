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
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        setSyncing(true);
        setComment(dayComment || "");

        const t = setTimeout(() => {
            setSyncing(false);
        }, 50);

        return () => clearTimeout(t);
    }, [chosenDay, dayComment]);

  

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    };

    const cantSave =
        syncing || waitComAnswer ||
        !isMy ||
        !habit?.ongoing ||
        comment.trim() === (dayComment || "").trim();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
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
        <div className={`habitDayCommentMobile ${open === "comment" ? "open" : "close"}`}>
            {open === "done" ? (
                <div className="bottomOpen" onClick={() => setOpen("comment")}>
                    <ChatCenteredIcon size={22}/> 
                </div>
            ) : (
                <>
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