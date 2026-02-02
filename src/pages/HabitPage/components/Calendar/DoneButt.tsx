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

  console.log(done, todayDone, isDone)

  useEffect(() => {
    if (isDone !== null && chosenDay) setDone(isDone)
    else setDone(todayDone)
  }, [chosenDay, isDone, todayDone])

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
