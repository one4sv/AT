import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowBendDownLeftIcon } from "@phosphor-icons/react";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";
import "../../../scss/DayComment.scss";
import CompletionProgress from "./ComplitionProgress";
import CounterProgression from "./CounterProgression";
import { todayStrFunc } from "../../../utils/dateToStr";

interface DayCommentProps {
  id: string;
  isMy: boolean;
}

export default function DayComment({ id, isMy }: DayCommentProps) {
  const { sendDayComment, waitComAnswer } = useDone();
  const { dayComment, habit, habitCounter, showCounter, habitSettings } = useTheHabit();
  const { chosenDay } = useCalendar();

  const [comment, setComment] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const todayStr = todayStrFunc();
  const isHistorical = chosenDay !== todayStr;
  const currentCounter = isHistorical ? showCounter : habitCounter;

  // Синхронизация с контекстом при смене дня или обновлении комментария
  useEffect(() => {
    setComment(dayComment || "");
  }, [dayComment]);

  // Авторесайз textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.3) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [comment, resizeTextarea]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const cantSave =
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
    <div className="dayCommentDiv">
      <div className="habitDayComment">
        <textarea
          placeholder="Комментарий"
          ref={textareaRef}
          readOnly={!isMy || (habit && !habit.ongoing)}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          value={comment}
          maxLength={200}
        />
        <div className="hdcTAExtra">
          <span>
            <ArrowBendDownLeftIcon /> shift+enter
          </span>
          <div>
            <span>{comment.length}/200</span>
            <button
              className="saveCommentButton"
              disabled={cantSave}
              onClick={handleSave}
            >
              {waitComAnswer ? <LoaderSmall /> : "Сохранить"}
            </button>
          </div>
        </div>
      </div>

      {habitSettings.metric_type === "timer" && <CompletionProgress />}
      {habitSettings.metric_type === "counter" && (
        <CounterProgression currentCounter={currentCounter} isHistorical={isHistorical} />
      )}
    </div>
  );
}