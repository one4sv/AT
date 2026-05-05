import { useMemo, useRef, useState, memo } from "react";
import type { Habit } from "../../../../components/context/HabitsContext";
import HoverDay from "./HoverDay";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { getDayArrays } from "../../../../components/ts/utils/getDayArrs";
import { useParams } from "react-router-dom";
import { dateToCalendarFormat, todayStrFunc } from "../../utils/dateToStr";

interface DayCellProps {
    habit: Habit | undefined;
    habits: Habit[] | null;
    day: number;
    type: "prev" | "this" | "post";
    month: number;
    year: number;
}

const DayCell = ({ habits, habit, day, month, year, type }: DayCellProps) => {
    const { setChosenDay, calendar, chosenDay } = useCalendar();
    const [hovered, setHovered] = useState(false);
    const { habitId: id } = useParams<{ habitId: string }>();
    const cellRef = useRef<HTMLDivElement | null>(null);

    const date = new Date(year, month, day);
    const todayStr = todayStrFunc()
    const dateStr = dateToCalendarFormat(date);

    const { completedArr, skippedArr, willArr, nowArr } = useMemo(
        () => getDayArrays(dateStr, calendar, habits, id, habit),
        [dateStr, calendar, habits, habit, id]
    );

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
                    setChosenDay(dateStr);
                } else {
                    setChosenDay(todayStrFunc());
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
                    ongoing={nowArr.length}
                    targetRef={cellRef}
                    comment={comment}
                />
            )}
        </div>
    );
};

export default memo(DayCell);