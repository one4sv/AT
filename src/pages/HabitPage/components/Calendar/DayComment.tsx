import { useEffect, useRef, useState } from "react";
import { useDone } from "../../../../components/hooks/DoneHook";
import { ArrowBendDownLeftIcon } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../components/ts/LoaderSmall";

interface DayCommentProps {
  id: string;
  isMy: boolean;
}

export default function DayComment({ id, isMy }: DayCommentProps) {
  const { sendDayComment, waitComAnswer } = useDone()
  const { dayComment, todayComment } = useTheHabit()
  const { chosenDay } = useCalendar()

  const [ comment, setComment ] = useState(todayComment || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.3) + "px";
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.3) + "px";
    }
  }, [comment]);

  useEffect(() => {
    if (dayComment !== null) setComment(dayComment)
    else setComment(todayComment || "")
  }, [dayComment, todayComment])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (comment.trim() !== "") {
        sendDayComment(id, comment, chosenDay);
      }
    }
  };

  return (
    <div className="habitDayComment">
      <textarea
        placeholder="Комментарий"
        ref={textareaRef}
        readOnly={!isMy}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        value={comment}
        maxLength={200}
      />
      <div className="hdcTAExtra">
        <span><ArrowBendDownLeftIcon/>shift+enter</span>
        <div>
          <span>{comment.length}/200</span>
          <button
            className="saveCommentButton"
            disabled={comment.trim() === "" || todayComment === "" || dayComment === "" || !isMy || waitComAnswer}
            onClick={() => sendDayComment(id, comment, chosenDay)}
          >
            {waitComAnswer ? (
              <LoaderSmall />
            ) : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
