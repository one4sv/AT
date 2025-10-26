import { Fire } from "@phosphor-icons/react";
import type { Calendar } from "../../../../components/context/CalendarContext";
import type { Habit } from "../../../../components/context/HabitsContext";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useEffect, useState } from "react";

export interface StreakType {
    habit: Habit;
    calendar: Calendar[];
}

export default function Streak({ habit, calendar }: StreakType) {
    const { habits } = useHabits()
    const [ isMy, setIsMy ] = useState(false)

    useEffect(() => {
        if (habits?.find(h => h.id === habit.id)) setIsMy(true)
    }, [habit.id, habits])

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const datesSet = new Set(calendar.map(d => d.date));
    const startDate = habit.start_date ? new Date(habit.start_date) : new Date(0);

    const checkStreak = (fromDate: Date) => {
        let count = 0;
        const checkDate = new Date(fromDate);

        if (habit.periodicity === "everyday") {
            while (checkDate >= startDate && datesSet.has(formatDate(checkDate))) {
                count++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        if (habit.periodicity === "weekly" && habit.chosen_days) {
            while (checkDate >= startDate) {
                const dayOfWeek = checkDate.getDay();
                if (habit.chosen_days.includes(dayOfWeek)) {
                    if (datesSet.has(formatDate(checkDate))) {
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

    const pluralizeDay = (streak: number) => {
        const n = Math.abs(streak) % 100;
        const lastDigit = n % 10;
        if (n > 10 && n < 20) return "дней";
        if (lastDigit === 1) return "день";
        if (lastDigit >= 2 && lastDigit <= 4) return "дня";
        return "дней";
    };

    const todayDayOfWeek = today.getDay();
    const isTodayChosenWeekly =
        habit.periodicity === "weekly" &&
        habit.chosen_days?.includes(todayDayOfWeek) &&
        today >= startDate;

    // Предупреждение «вчера был стрик», только если today — обычный день
    let showYesterdayWarning = false;
    if (habit.periodicity !== "sometimes" && !isTodayChosenWeekly && yesterday >= startDate) {
        const yesterdayDayOfWeek = yesterday.getDay();
        const isYesterdayChosen =
            habit.periodicity === "everyday" ||
            (habit.periodicity === "weekly" && habit.chosen_days?.includes(yesterdayDayOfWeek));

        if (isYesterdayChosen && datesSet.has(formatDate(yesterday)) && !datesSet.has(formatDate(today))) {
            showYesterdayWarning = true;
        }
    }
    return (
        <div className="streakDiv">
            {habit.periodicity === "sometimes" && (
                <div className="streakStr null">
                    Стрик для этой привычки недоступен
                </div>
            )}

            {habit.periodicity !== "sometimes" && !isTodayChosenWeekly && habit.periodicity === "weekly" ? (
                <div className="streakStr start">
                    <Fire weight="fill" size={24}/> 
                    {isMy && "Сегодня можно отдохнуть! "} 
                    Streak:&nbsp;<span>{streak}</span>&nbsp;{pluralizeDay(streak)}
                </div>
            ) : habit.periodicity !== "sometimes" && showYesterdayWarning ? (
                <div className="streakStr warn">
                    <Fire weight="fill" size={24}/> 
                    {isMy && `Не потеряйте стрик `}<span>{streakUntilYesterday}</span>&nbsp;{pluralizeDay(streakUntilYesterday)}!
                </div>
            ) : habit.periodicity !== "sometimes" && (
                streak === 0 ? (
                    <div className="streakStr null">
                        <Fire weight="fill" size={24}/> 
                        {isMy ? "Никогда не поздно начать!" : "Streak: 0"}
                    </div>
                ) : streak > 7 ? (
                    <div className="streakStr cont">
                        <Fire weight="fill" size={24}/> 
                        {isMy && "Да вы в ударе!"} Streak:&nbsp;<span>{streak}</span>&nbsp;{pluralizeDay(streak)}
                    </div>
                ) : (
                    <div className="streakStr start">
                        <Fire weight="fill" size={24}/> 
                        {isMy && "Начало положено! "} 
                        Streak:&nbsp;<span>{streak}</span>&nbsp;{pluralizeDay(streak)}
                    </div>
                )
            )}
        </div>
    );
}
