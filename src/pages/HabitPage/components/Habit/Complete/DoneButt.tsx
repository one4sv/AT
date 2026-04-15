import { CheckCircle, Circle } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";

interface DoneButtonProps {
  habitId: number;
}

export default function DoneButton({ habitId }: DoneButtonProps) {
  const { todayDone, isDone, doable } = useTheHabit();
  const { markDoneWLoading, waitDoneAnswer } = useDone();
  const { chosenDay } = useCalendar();

  // Прямо используем значение из контекста — больше нет локального состояния и лишнего эффекта
  const displayDone = isDone !== null ? isDone : todayDone;

  if (!doable) return null;

  return (
    <button
      className={`doneButt ${displayDone ? "dbComp" : "dbMark"}`}
      onClick={() => markDoneWLoading(habitId, chosenDay)}
    >
      {displayDone ? <CheckCircle weight="fill" /> : <Circle />}
      {waitDoneAnswer ? <LoaderSmall /> : displayDone ? "Выполнено" : "Выполнить"}
    </button>
  );
}