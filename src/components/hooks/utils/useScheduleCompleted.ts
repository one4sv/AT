import { useMemo } from "react";
import { useSchedule } from "../ScheduleHook";
import { useSettings } from "../SettingsHook";
import { useCalendar } from "../CalendarHook";
import { timeToMinutes, todayStrFunc } from "../../../pages/HabitPage/utils/dateToStr";
import { isOddWeek } from "../../../pages/HabitPage/utils/isOddWeek";
import type { ScheduleBlockType } from "../../context/ScheduleContext";

export function useScheduleCompleted(id?: string) {
    const { habitSchedule, schedule_settings, scheduleCompletions } = useSchedule();
    const { weekStart } = useSettings();
    const { chosenDay } = useCalendar();
    
    return useMemo(() => {
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

        const c = currentSchedule
            .map((s) => ({
                ...s,
                completed: scheduleCompletions.some(
                    (c) => c.schedule_id === s.id && c.date === dateStr
                ),
            }))
            .sort(
                (a, b) =>
                    timeToMinutes(a.start_time) -
                    timeToMinutes(b.start_time)
            );

        return(c)
    }, [
        id,
        habitSchedule,
        schedule_settings,
        scheduleCompletions,
        weekStart,
        chosenDay,
    ]);
}