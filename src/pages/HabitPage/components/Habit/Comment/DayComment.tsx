import { useActivityCommentPhotos } from "../../../../../components/ts/ActivityCommentPhotos";
import EmojiButton from "../../../../../components/ts/utils/EmojiButton";
import EmojiBar from "../../../../../components/ts/utils/EmojiBar";
import TA from "../../../../../components/ts/TA";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowBendDownLeftIcon, ClockCountdownIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/DayComment.scss";
import { isMobile } from "react-device-detect";

interface DayCommentProps {
  id: string;
  isMy: boolean;
}

export default function DayComment({ id, isMy }: DayCommentProps) {
  const { t } = useTranslation("common");

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


  useEffect(() => { setShowEmojiBar(false); }, [chosenDay]);

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
      photos.save(comment);
    }
  };

  return (
    <div className="habitDayComment inputWithEmoji" ref={emojiRef}>
      <EmojiButton taRef={textAreaRef} open={showEmojiBar} setOpen={setShowEmojiBar} disabled={!isMy || !habit?.ongoing || syncing} />
      <EmojiBar taRef={textAreaRef} setText={setComment} showEmojiBar={showEmojiBar} setShowEmojiBar={setShowEmojiBar} emojiRef={emojiRef} />
      <TA
        placeholder={t("habitPageUi.day.commentPlaceholder")}
        taRef={textAreaRef}
        readOnly={!isMy || !habit?.ongoing || !photos.ready || photos.busy}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        value={comment}
        maxLength={200}
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