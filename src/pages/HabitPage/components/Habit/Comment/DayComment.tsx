import { useEffect, useRef, useState } from "react";
import { ArrowBendDownLeftIcon, ClockCountdownIcon } from "@phosphor-icons/react";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/DayComment.scss";
import { isMobile } from "react-device-detect";
import { Check } from "lucide-react";

interface DayCommentProps {
  id: string;
  isMy: boolean;
}

export default function DayComment({ id, isMy }: DayCommentProps) {
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

  useEffect(() => {
    const ta = textAreaRef.current;
    if (!ta) return;

    ta.style.height = "0px";
    ta.style.overflowY = "hidden";

    const minHeight = window.innerHeight * 0.05;
    const maxHeight = window.innerHeight * 0.5;

    let newHeight = ta.scrollHeight;

    // Всегда не меньше 5vh
    if (newHeight < minHeight) {
        newHeight = minHeight;
    }

    // Ограничиваем максимумом
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
    if (e.key === "Enter" && !e.shiftKey && !isMobile) {
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
    <div className="habitDayComment">
      <textarea
        placeholder="Комментарий"
        ref={textAreaRef}
        readOnly={!isMy || (habit && !habit.ongoing)}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        value={comment}
        maxLength={200}
      />
      <div className="hdcTAExtra"
      >
        {!isMobile ? (
          <span>
            <ArrowBendDownLeftIcon /> shift+enter
          </span>
        ) : ""}
        <div>
          <span>{comment.length}/200</span>
          <button
            className="saveCommentButton"
            disabled={cantSave  || waitComAnswer}
            onClick={handleSave}
          >
          {waitComAnswer
            ? <ClockCountdownIcon size={24}/>
            : <Check/>
          }
            </button>
        </div>
      </div>
    </div>
  );
}