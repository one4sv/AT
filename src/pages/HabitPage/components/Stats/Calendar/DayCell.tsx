import { useMemo, useRef, useState } from "react";
import type { Habit } from "../../../../../components/context/HabitsContext";
import HoverDay from "./HoverDay";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { getDayArrays } from "../../../../../components/ts/utils/getDayArrs";
import { useParams } from "react-router-dom";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";

interface DayCellProps {
    habit: Habit | undefined;
    habits: Habit[] | null;
    day: number;
    type: "prev" | "this" | "post";
    month: number;
    year: number;
}
const toDateStr = (d: Date | string) => {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
};

export default function DayCell({ habits, habit, day, month, year, type }: DayCellProps) {
    const { setChosenDay, calendar, chosenDay, timers, counters } = useCalendar()
    const { setDayComment, setIsDone, setDoable, setShowTimer, setShowCounter } = useTheHabit()
    const [hovered, setHovered] = useState(false);
    const { habitId:id } = useParams<{ habitId: string }>();
    const cellRef = useRef<HTMLDivElement | null>(null);
    const today = new Date();
    const date = new Date(year, month, day);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const { completedArr, skippedArr, willArr, nowArr } = useMemo(
        () => getDayArrays(dateStr, calendar, habits, id, habit),
        [dateStr, calendar, habits, habit, id]
    )

    const comment = useMemo(() => {
        const found = calendar.find(c => c.date === dateStr);
        return found ? found.comment : "";
    }, [calendar, dateStr]);

    return (
        <div
            ref={cellRef}
            className={`calDay ${type}Days ${dateStr === todayStr ? "todayCD" : ""} ${chosenDay === dateStr ? "chosenDayCal" : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => {
                if (chosenDay !== dateStr) {
                    setChosenDay(dateStr)
                    setDayComment(comment || "")
                    setShowTimer(timers?.find(t => toDateStr(t.end_at) === dateStr) || null)
                    setShowCounter(counters?.find(t => toDateStr(t.started_at) === dateStr) || null)
                    if (completedArr.length > 0) {
                        setIsDone(true)
                        setDoable(true)
                    } else if (skippedArr.length > 0) {
                        setIsDone(false)
                        setDoable(true)
                    } else if (nowArr.length > 0) {
                        setIsDone(false)
                        setDoable(true)
                    }
                    else {
                        setIsDone(false)
                        setDoable(false)
                    }
                }
                else {
                    setChosenDay("")
                    setDayComment(null)
                    setIsDone(null)
                    setDoable(true)
                    setShowTimer(null)
                    setShowCounter(null)
                }
            }}
        >
            <span>{day}</span>
            <div className="calendarDots">
                {completedArr.length > 0 && <div className="calendarDot comp"></div>}
                {nowArr.length > 0 && <div className="calendarDot now"></div>}
                {willArr.length > 0 && <div className="calendarDot will"></div>}
                {skippedArr.length > 0 && <div className="calendarDot skip"></div>}
            </div>
            {hovered && (
                <HoverDay
                    completed={completedArr.length}
                    missed={skippedArr.length}
                    planned={willArr.length}
                    targetRef={cellRef}
                    comment={comment}
                />
            )}
        </div>
        
    );
}
