import { Fire } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { Calendar } from "../../../../components/context/CalendarContext";
import type { Habit } from "../../../../components/context/HabitsContext";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useEffect, useState } from "react";
import { getStreakView } from "../../utils/getStreakView";
import "../../scss/Streak.scss";
import { dateToCalendarFormat, todayStrFunc } from "../../../../components/ts/utils/dateToStr";

export interface StreakType {
    habit: Habit;
    calendar: Calendar[];
}

export default function Streak({ habit, calendar }: StreakType) {
    const { t } = useTranslation("common");
    const { habits } = useHabits()
    const [ isMy, setIsMy ] = useState(false)

    useEffect(() => {
        if (habits?.find(h => h.id === habit.id)) setIsMy(true)
    }, [habit.id, habits])

    const today = new Date(todayStrFunc() + "T12:00:00");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const datesSet = new Set(calendar.map(d => d.isDone === true ? d.date : null));
    const startDate = habit.start_date ? new Date(habit.start_date + "T12:00:00") : new Date(0);

    const checkStreak = (fromDate: Date) => {
        let count = 0;
        const checkDate = new Date(fromDate);

        if (habit.periodicity === "everyday") {
            while (checkDate >= startDate && datesSet.has(dateToCalendarFormat(checkDate))) {
                count++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        if (habit.periodicity === "weekly" && habit.chosen_days) {
            while (checkDate >= startDate) {
                const dayOfWeek = checkDate.getDay();
                if (habit.chosen_days.includes(dayOfWeek)) {
                    if (datesSet.has(dateToCalendarFormat(checkDate))) {
                        count++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else break;
                } else {
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            }
        }

        return count;
    };

    const streak = checkStreak(today);
    const streakUntilYesterday = checkStreak(yesterday);

    const todayDayOfWeek = today.getDay();
    const isTodayChosenWeekly =
        habit.periodicity === "weekly" &&
        habit.chosen_days?.includes(todayDayOfWeek) &&
        today >= startDate;

    let showYesterdayWarning = false;
    if (habit.periodicity !== "sometimes" && !isTodayChosenWeekly && yesterday >= startDate) {
        const yesterdayDayOfWeek = yesterday.getDay();
        const isYesterdayChosen =
            habit.periodicity === "everyday" ||
            (habit.periodicity === "weekly" && habit.chosen_days?.includes(yesterdayDayOfWeek));

        if (isYesterdayChosen && datesSet.has(dateToCalendarFormat(yesterday)) && !datesSet.has(dateToCalendarFormat(today))) {
            showYesterdayWarning = true;
        }
    }

    const view = getStreakView(habit, streak, streakUntilYesterday, isMy, showYesterdayWarning, isTodayChosenWeekly);
    const { cl, text, showCount, count } = view || {};

    if (!view) return null
    if (!habit.ongoing) return (
        <div className="streakStr">
            {t("habitPageUi.streak.archived")}
        </div>
    )

    return (
        <div className={`streakStr ${cl}`}>
            <Fire weight="fill" size={16} />
            {text && `${text} `}
            {showCount && count && (
                <>
                    {t("habitPageUi.streak.label")}:&nbsp;<span>{count}</span>&nbsp;
                    {t("habitPageUi.streak.days", { count })}
                </>
            )}
        </div>
    )
    
}
