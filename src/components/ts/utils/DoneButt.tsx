import { CheckCircle, Circle } from "@phosphor-icons/react";

interface DoneButtonProps {
  isDone: boolean;
  habitId: number;
  markDone: (id: number) => void;
}

export default function DoneButton({ isDone, habitId, markDone }: DoneButtonProps) {
  return (
    <button
      className={`doneButt ${isDone ? "dbComp" : "dbMark"}`}
      onClick={() => markDone(habitId)}
    >
      {isDone ? <CheckCircle weight="fill" /> : <Circle />}
      {isDone ? "Выполнено" : "Выполнить"}
    </button>
  );
}
