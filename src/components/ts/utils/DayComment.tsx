import { useEffect, useRef, useState } from "react";
import { useDone } from "../../hooks/DoneHook";

interface DayCommentProps {
  id: string;
  dayComment: string;
}

export default function DayComment({ id, dayComment }: DayCommentProps) {
  const { sendDayComment } = useDone()
  const [ comment, setComment ] = useState(dayComment || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto"; // сброс, чтобы scrollHeight был корректным
      // высота по контенту, максимум 30% высоты окна
      el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.3) + "px";
    }
  };

  // При первом рендере тоже можно подстроить под начальный контент
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.3) + "px";
    }
  }, []);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (comment.trim() !== "") {
        sendDayComment(id, comment);
      }
    }
  };

  return (
    <div className="habitDayComment">
      <textarea
        placeholder="Комментарий"
        ref={textareaRef}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        value={comment}
        maxLength={200}
      />
      <div className="hdcTAExtra">
        <span>{comment.length}/200</span>
        <button
          className="saveCommentButton"
          disabled={comment.trim() === ""}
          onClick={() => sendDayComment(id, comment)}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
