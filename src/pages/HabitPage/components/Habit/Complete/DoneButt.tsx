import { CalendarBlankIcon, CalendarDotIcon, CheckCircle, Circle } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";
import { usePlanned } from "../../../../../components/hooks/PlannedHook";

interface DoneButtonProps {
  habitId: number;
}

export default function DoneButton({ habitId }: DoneButtonProps) {
  const { todayDone, isDone, doable, planable, isPlanned } = useTheHabit();
  const { markDoneWLoading, waitDoneAnswer } = useDone();
  const { waitPlanAnswer, markPlanWLoading } = usePlanned()
  const { chosenDay } = useCalendar();

  const displayDone = isDone !== null ? isDone : todayDone;
  const displayPlan = isPlanned

  if (!doable && !planable) return null;

  console.log(planable, isPlanned)

  if (planable) return (
    <div className="doneButtDiv">
      <button
        className={`doneButt planButt ${displayDone ? "dbComp" : "dbMark"}`}
        onClick={() => markPlanWLoading(habitId, chosenDay)}
      >
        {displayPlan ? <CalendarDotIcon /> : <CalendarBlankIcon />}
        {waitPlanAnswer ? <LoaderSmall /> : displayPlan ? "Запланировано" : "Запланировать"}
      </button>
    </div>
  )

  return (
    <div className="doneButtDiv">
      <button
        className={`doneButt ${displayDone ? "dbComp" : "dbMark"}`}
        onClick={() => markDoneWLoading(habitId, chosenDay)}
      >
        {displayDone ? <CheckCircle weight="fill" /> : <Circle />}
        {waitDoneAnswer ? <LoaderSmall /> : displayDone ? "Выполнено" : "Выполнить"}
      </button>
    </div>
  );
}