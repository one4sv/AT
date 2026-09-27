import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChatCenteredIcon, ClockCountdownIcon } from "@phosphor-icons/react";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/DayComment.scss";
import { SendHorizonal } from "lucide-react";

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
    console.log(comment)
    if (textAreaRef && textAreaRef.current) console.log(textAreaRef.current.scrollHeight)
    useEffect(() => {
        setSyncing(true);
        setComment(dayComment || "");

        const t = setTimeout(() => {
            setSyncing(false);
        }, 50);

        return () => clearTimeout(t);
    }, [chosenDay, dayComment]);

    useEffect(() => {
        const ta = textAreaRef.current;
        if (!ta) return;

        // Сбрасываем высоту, чтобы корректно измерить scrollHeight
        ta.style.height = "0px";
        ta.style.overflowY = "hidden";

        const minHeight = window.innerHeight * 0.05; // 5vh
        const maxHeight = window.innerHeight * 0.5;  // 50vh

        // scrollHeight уже включает padding (благодаря box-sizing: border-box)
        let newHeight = Math.max(ta.scrollHeight, minHeight);

        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            ta.style.overflowY = "auto";
        } else {
            ta.style.overflowY = "hidden";
        }

        ta.style.height = `${newHeight}px`;
    }, [comment]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    };

    const cantSave =
        syncing ||
        !isMy ||
        !habit?.ongoing ||
        comment.trim() === (dayComment || "").trim();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
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
                    <textarea
                        placeholder="Комментарий"
                        ref={textAreaRef}
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
                                : <SendHorizonal fill="currentColor"/>
                            }
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}