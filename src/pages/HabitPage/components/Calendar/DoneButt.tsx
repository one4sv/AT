import { CheckCircle, Circle } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useEffect, useState } from "react";
import { useDone } from "../../../../components/hooks/DoneHook";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../components/ts/LoaderSmall";

interface DoneButtonProps {
  habitId: number;
}

export default function DoneButton({ habitId }: DoneButtonProps) {
  const { todayDone, isDone  } = useTheHabit()
  const { markDoneWLoading, waitDoneAnswer } = useDone()
  const { chosenDay } = useCalendar()
  const [ done, setDone ] = useState(todayDone)
  
  console.log("isDone", isDone, "todayDone", todayDone, "done", done)

  useEffect(() => {
    if (isDone !== null) setDone(isDone)
    else setDone(todayDone)
  }, [chosenDay, isDone, todayDone, chosenDay])

  return (
    <button
      className={`doneButt ${done ? "dbComp" : "dbMark"}`}
      onClick={() => markDoneWLoading(habitId, chosenDay)}
    >
      {done ? <CheckCircle weight="fill" /> : <Circle />}
      {waitDoneAnswer ? (
        <LoaderSmall />
      ) : done ? "Выполнено" : "Выполнить"}
    </button>
  );
}
