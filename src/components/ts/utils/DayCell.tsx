import { useMemo, useRef, useState } from "react";
import type { Habit } from "../../context/HabitsContext";
import HoverDay from "./HoverDay";
import { useParams } from "react-router-dom";
import { useCalendar } from "../../hooks/CalendarHook";
import { getDayArrays } from "./getDayArrs";

interface DayCellProps {
    habit: Habit | undefined;
    habits: Habit[] | null;
    day: number;
    type: "prev" | "this" | "post";
    month: number;
    year: number;
}

export default function DayCell({ habits, day, month, year, type }: DayCellProps) {
    const { setChosenDay, calendar, chosenDay } = useCalendar()
    const { habitId:id } = useParams<{ habitId: string }>();
    const [hovered, setHovered] = useState(false);
    const cellRef = useRef<HTMLDivElement | null>(null);
    const today = new Date();
    const date = new Date(year, month, day);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const { completedArr, skippedArr, willArr } = useMemo(
        () => getDayArrays(dateStr, calendar, habits, id),
        [dateStr, calendar, habits, id]
    )

    const comment = useMemo(() => {
        const found = calendar.find(c => c.date === dateStr);
        return found ? found.comment : "";
    }, [calendar, dateStr]);


    return (
        <div
            ref={cellRef}
            className={`calDay ${type}Days ${dateStr === todayStr ? "todayCD" : ""} ${chosenDay === dateStr && !id ? "chosenDayCal" : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => setChosenDay(dateStr)}
        >
            <span>{day}</span>
            <div className="calendarDots">
                {completedArr.length > 0 && <div className="calendarDot comp"></div>}
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
