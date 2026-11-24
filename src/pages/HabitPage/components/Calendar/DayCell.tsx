import { useMemo, useRef, useState, memo } from "react";
import type { Habit } from "../../../../components/context/HabitsContext";
import HoverDay from "./HoverDay";
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { getDayArrays } from "../../../../components/ts/utils/getDayArrs";
import { useParams } from "react-router-dom";
import { dateToCalendarFormat, todayStrFunc } from "../../../../components/ts/utils/dateToStr";

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
    const { plans } = usePlans();
    const {openMenu,menu}=useContextMenu();
    const [hovered, setHovered] = useState(false);
    const { habitId: id } = useParams<{ habitId: string }>();
    const cellRef = useRef<HTMLDivElement | null>(null);

    const date = new Date(year, month, day);
    const todayStr = todayStrFunc()
    const dateStr = dateToCalendarFormat(date);
    const oneOffCount = !id ? plans.filter(plan => plan.plan_date === dateStr && plan.membership_status !== "pending").length : 0;

    const { completedArr, skippedArr, willArr, nowArr, plannedArr } = useMemo(
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
            data-context-menu="true"
            data-calendar-date={dateStr}
            onContextMenu={e=>{
                e.preventDefault();e.stopPropagation();setHovered(false);
                openMenu(e.clientX,e.clientY,"calendarDay",{id:dateStr,habitId:id},habit);
            }}
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
                {(plannedArr.length > 0 || willArr.length > 0 || oneOffCount > 0) && (
                    <div className="calendarDot will"></div>
                )}
                {skippedArr.length > 0 && <div className="calendarDot skip"></div>}
            </div>
            {hovered && !menu.visible && (
                <HoverDay
                    date={dateStr}
                    habitId={id}
                    completed={completedArr.length}
                    missed={skippedArr.length}
                    planned={willArr.length + plannedArr.length + oneOffCount}
                    ongoing={nowArr.length}
                    targetRef={cellRef}
                    comment={comment}
                />
            )}
        </div>
    );
};

export default memo(DayCell);