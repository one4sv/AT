import { CalendarBlankIcon, CalendarCheckIcon, CheckCircle, Circle, ClockIcon } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useTranslation } from "react-i18next";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";
import { usePlanned } from "../../../../../components/hooks/PlannedHook";

interface DoneButtonProps {
  habitId: number;
}

export default function DoneButton({ habitId }: DoneButtonProps) {
  const { t } = useTranslation("common");
  const { todayDone, isDone, doable, planable, isPlanned, habit } = useTheHabit();
  const { markDoneWLoading, waitDoneAnswer } = useDone();
  const { waitPlanAnswer, markPlanWLoading } = usePlanned()
  const { chosenDay } = useCalendar();

  const displayDone = isDone !== null ? isDone : todayDone;
  const displayPlan = isPlanned
  const beforeJoining = !!habit?.chat_id && !habit.access?.is_owner &&
    (!habit.access?.completion_start_date || chosenDay < habit.access.completion_start_date);

  if (!doable && !planable) return (
    <div className="doneButtDiv">
      <button
        className="doneButt disabled"
        onClick={() => undefined}
      >
        <ClockIcon/>
        {beforeJoining ? t("habitPageUi.done.beforeJoining") : t("habitPageUi.done.waiting")}
      </button>
    </div>
  )

  return (
    <div className="doneButtDiv">
      {planable ? (
        <button
          className={`doneButt planButt ${displayDone ? "dbComp" : "dbMark"}`}
          onClick={() => markPlanWLoading(habitId, chosenDay)}
        >
          {displayPlan ? <CalendarCheckIcon /> : <CalendarBlankIcon />}
          {waitPlanAnswer ? <LoaderSmall /> : displayPlan ? t("habitPageUi.done.planned") : t("habitPageUi.done.plan")}
        </button>
      ) : (
        <button
          className={`doneButt ${displayDone ? "dbComp" : "dbMark"}`}
          onClick={() => markDoneWLoading(habitId, chosenDay)}
        >
          {displayDone ? <CheckCircle weight="fill" /> : <Circle />}
          {waitDoneAnswer ? <LoaderSmall /> : displayDone ? t("habitUi.done") : t("habitUi.complete")}
        </button>
      )}
      
    </div>
  );
}