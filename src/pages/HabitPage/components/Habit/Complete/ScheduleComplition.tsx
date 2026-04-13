import { useMemo, useState } from "react";
import { useSchedule } from "../../../../../components/hooks/ScheduleHook";
import { useParams } from "react-router";
import { isOddWeek } from "../../../utils/isOddWeek";
import { useSettings } from "../../../../../components/hooks/SettingsHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/scheduleComp.scss";
import { CheckCircleIcon, Circle } from "@phosphor-icons/react";
import { timeToMinutes, todayStrFunc } from "../../../utils/dateToStr";
import type { ScheduleBlockType } from "../../../../../components/context/ScheduleContext";

export default function ScheduleComplition() {
    const { habitSchedule, schedule_settings, scheduleComplete, scheduleCompletions } = useSchedule();
    const { weekStart } = useSettings();
    const { chosenDay } = useCalendar();
    const { habitId: id } = useParams<{ habitId: string }>();

    const [ hover, setHover ] = useState<number>(0)

    const scheduleCompleted = useMemo(() => {
        if (!id || !habitSchedule[id]) return [];

        let currentDate = new Date();
        if (chosenDay !== "") currentDate = new Date(chosenDay);

        const currentSettings = schedule_settings[String(id)];
        let currentSchedule: ScheduleBlockType[] = [];

        if (currentSettings?.isSeparated) {
            const isOdd = isOddWeek(weekStart, currentDate);
            currentSchedule = habitSchedule[id].filter(
                (s) =>
                    s.isSeparator === !isOdd &&
                    s.day_of_week === currentDate.getDay()
            );
        } else {
            currentSchedule = habitSchedule[id].filter(
                (s) => s.day_of_week === currentDate.getDay()
            );
        }

        const dateStr = chosenDay || todayStrFunc();
        return currentSchedule.map((s) => {
            const isCompleted = scheduleCompletions.some(
                (c) => c.schedule_id === s.id && c.date === dateStr
            )

            return {
                ...s,
                completed: isCompleted,
            };
        }).sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    }, [id, habitSchedule, chosenDay, schedule_settings, weekStart, scheduleCompletions]);

    const date = chosenDay || todayStrFunc();

    if (!id) return null;

    return (
        <div className="scheduleCompilition">
            {scheduleCompleted.map((s) => (
                <div
                    className="scheduleButt"
                    key={s.id}
                    onClick={() => scheduleComplete(id, s.id, date)}
                    onMouseOver={() => setHover(s.id)}
                    onMouseLeave={() => setHover(0)}
                >
                    <div className="scheduleButtInfo">
                        <span className="scheduleButtSpan">
                            {s.start_time} - {s.end_time}:
                        </span>
                        {s.name}
                    </div>
                    <div className="scheduleButtSvg">
                        {s.completed
                            ? <CheckCircleIcon weight="fill" className="scsvg"/>
                            : hover === s.id ? <CheckCircleIcon/> : <Circle/>
                        }
                    </div>
                </div>
            ))}
            {scheduleCompleted.length === 0 &&  (<span className="scheduleRest">
                Выходной
            </span>)}
        </div>
    );
}