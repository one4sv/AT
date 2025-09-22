import { useMemo, useRef, useState } from "react";
import type { Calendar } from "../../context/CalendarContext";
import type { Habit } from "../../context/HabitsContext";
import HoverDay from "./HoverDay";
import { useParams } from "react-router-dom";

interface DayCellProps {
    calendar: Calendar[];
    habit: Habit | undefined;
    habits: Habit[] | null;
    day: number;
    type: "prev" | "this" | "post";
    month: number;
    year: number;
}

export default function DayCell({ calendar, habit, habits, day, month, year, type }: DayCellProps) {
    const { habitId:id } = useParams<{ habitId: string }>();
    const sd = habit?.start_date;
    const per = habit?.periodicity;
    const cellRef = useRef<HTMLDivElement | null>(null);
    const [hovered, setHovered] = useState(false);
    
    const today = new Date();
    const date = new Date(year, month, day);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;


    const completedArr = useMemo(() => {
        return calendar?.filter(c => c.date === dateStr) ?? [];
    }, [calendar, dateStr]);

    const willArr = useMemo(() => {
        const result: { habitId: string; habitName: string; date: string }[] = [];

        if (id && per === "everyday" && date > today && sd && new Date(sd) <= date) {
            result.push({ habitId: id!.toString(), habitName: habit.name, date: dateStr });
        }

        if (!id && habits && date > today) {
            habits.forEach(h => {
                if (h.id !== Number(id) && h.periodicity === "everyday" && new Date(h.start_date) <= date) {
                    result.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr });
                }
            });
        }
        return result;
    }, [date, dateStr, habit, habits, id, per, sd, today]);

    const skippedArr = useMemo(() => {
        const result: { habitId: string; habitName: string; date: string }[] = [];

        if (id) {
            if (date <= today && sd && new Date(sd) <= date && !completedArr.some(c => c.date === dateStr)) {
                if (per === "everyday") {
                    console.log(!completedArr.some(c => c.date === dateStr && c.habitId === id))
                    result.push({ habitId: id, habitName: habit.name, date: dateStr });
                }
            }
        }
        else {
            habits?.forEach(h => {
                if (new Date(h.start_date) <= date && date <= today && sd && !completedArr.some(c => c.date === dateStr && Number(c.habitId) === h.id)) {
                    if (h.periodicity === "everyday") result.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr });
                }
            });
        }
        return result;
    }, [habit, per, date, today, sd, completedArr, habits, dateStr, id]);

    return (
        <div
            ref={cellRef}
            className={`calDay ${type}Days`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span>{day}</span>
            <div className="calendarDots">
                {completedArr.length > 0 && <div className="calendarDot comp"></div>}
                {willArr.length > 0 && <div className="calendarDot will"></div>}
                {skippedArr.length > 0 && <div className="calendarDot skip"></div>}
            </div>
            {hovered && !id && (
                <HoverDay
                    completed={completedArr.length}
                    missed={skippedArr.length}
                    planned={willArr.length}
                    targetRef={cellRef}
                />
            )}

        </div>
        
    );
}
