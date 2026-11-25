import { useActivityCommentPhotos } from "../../../../../components/ts/ActivityCommentPhotos";
import EmojiButton from "../../../../../components/ts/utils/EmojiButton";
import EmojiBar from "../../../../../components/ts/utils/EmojiBar";
import TA from "../../../../../components/ts/TA";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowBendDownLeftIcon, ClockCountdownIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useHabits } from "../../../../../components/hooks/HabitsHook";
import { useUser } from "../../../../../components/hooks/UserHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/DayComment.scss";
import { isMobile } from "react-device-detect";
import { todayStrFunc } from "../../../../../components/ts/utils/dateToStr";

interface DayCommentProps {
  id: string;
  isMy: boolean;
  date?: string;
  modal?: boolean;
}

export default function DayComment({ id, isMy, date, modal = false }: DayCommentProps) {
  const { t } = useTranslation("common");

  const { dayComment, habit: currentHabit } = useTheHabit();
  const { habits } = useHabits();
  const { user } = useUser();
  const { chosenDay: calendarDay } = useCalendar();
  const chosenDay = date ?? calendarDay;
  const habit = modal && String(currentHabit?.id)!==id ? habits?.find(h=>String(h.id)===id) : currentHabit;
  const canEdit = modal ? Boolean(user.id && habit?.ongoing && chosenDay>=habit.start_date && chosenDay<=todayStrFunc() && (!habit.end_date || chosenDay<=habit.end_date) && (!habit.access?.completion_start_date || chosenDay>=habit.access.completion_start_date) && (habit.access?.can_comment ?? habit.user_id===user.id)) : isMy;
  const fallbackComment = modal ? "" : dayComment;
    const visible=String(habit?.id)===id && !!(habit?.access?.is_member || habit?.access?.is_owner || (modal ? habit?.user_id===user.id : isMy)) &&
        (!habit?.access?.completion_start_date || chosenDay>=habit.access.completion_start_date);
    const photos=useActivityCommentPhotos(id,chosenDay,visible,visible && !!habit?.ongoing && canEdit);
    const waitComAnswer=photos.busy;

  const [comment, setComment] = useState<string>("");
  const [syncing, setSyncing] = useState(true);
  const [ showEmojiBar, setShowEmojiBar ] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSyncing(true);
    setComment(photos.savedText ?? fallbackComment ?? "");

    const t = setTimeout(() => {
      setSyncing(false);
    }, 50);

    return () => clearTimeout(t);
  }, [id, chosenDay, photos.savedText, photos.ready ? undefined : fallbackComment]);


  useEffect(() => { setShowEmojiBar(false); }, [chosenDay]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const cantSave =
    syncing || waitComAnswer ||
    !canEdit ||
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
      photos.save(comment);
    }
  };

  return (
    <div className="habitDayComment inputWithEmoji" ref={emojiRef}>
      <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar} disabled={!canEdit || !habit?.ongoing || syncing} />
      <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar} setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef} cn={modal ? "calendarCommentEmoji" : undefined} />
      <TA
        placeholder={t("habitPageUi.day.commentPlaceholder")}
        taRef={textAreaRef}
        readOnly={!canEdit || !habit?.ongoing || !photos.ready || photos.busy}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        value={comment}
        maxLength={200}
        minHeight={modal ? 16 : 5}
        maxHeight={modal ? 32 : 50}
      />
      {photos.previews}
      <div className="hdcTAExtra"
      >
        {!isMobile ? (
          <span>
            <ArrowBendDownLeftIcon /> shift+enter
          </span>
        ) : ""}
        <div>
          {photos.controls}
          <span>{comment.length}/200</span>
          <button
            className="saveCommentButton"
            disabled={cantSave  || waitComAnswer}
            onClick={handleSave}
          >
          {waitComAnswer
            ? <ClockCountdownIcon size={24}/>
            : <PaperPlaneRightIcon weight="fill" size={24}/>
          }
            </button>
        </div>
      </div>
    </div>
  );
}