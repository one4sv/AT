import { CheckCircle, Circle } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useEffect, useState } from "react";
import { useDone } from "../../../../components/hooks/DoneHook";
import { useCalendar } from "../../../../components/hooks/CalendarHook";

interface DoneButtonProps {
  habitId: number;
}

export default function DoneButton({ habitId }: DoneButtonProps) {
  const { todayDone, isDone } = useTheHabit()
  const { markDone } = useDone()
  const { chosenDay } = useCalendar()
  const [ done, setDone ] = useState(todayDone)
  
  useEffect(() => {
    if (isDone !== null) setDone(isDone)
    else setDone(todayDone)
  }, [isDone, todayDone])

  return (
    <button
      className={`doneButt ${done ? "dbComp" : "dbMark"}`}
      onClick={() => markDone(habitId, chosenDay)}
    >
      {done ? <CheckCircle weight="fill" /> : <Circle />}
      {done ? "Выполнено" : "Выполнить"}
    </button>
  );
}
