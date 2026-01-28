import type { Habit } from "../../../components/context/HabitsContext";

export type StreakView = {
    cl: string;
    text?: string;
    showCount: boolean;
    count: number;
}
export const getStreakView = (
    habit: Habit,
    streak: number,
    streakUntilYesterday: number,
    isMy: boolean,
    showYesterdayWarning: boolean,
    isTodayChosenWeekly?: boolean
): StreakView | null => {

    if (habit.periodicity === "sometimes") {
        return {
            cl: "null",
            text: "Стрик для этой активности недоступен.",
            showCount: false,
            count:0
        };
    }

    if (
        habit.periodicity === "weekly" &&
        !isTodayChosenWeekly &&
        streak > 0
    ) {
        return {
            cl: "start",
            text: isMy ? "Сегодня можно отдохнуть." : undefined,
            showCount: true,
            count: streak,
        };
    }

    if (showYesterdayWarning) {
        return {
            cl: "warn",
            text: isMy ? "Не потеряйте стрик!" : undefined,
            showCount: true,
            count: streakUntilYesterday,
        };
    }

    if (streak === 0) {
        return {
            cl: "null",
            text: isMy ? "Никогда не поздно начать!" : undefined,
            showCount: false,
            count:0
        };
    }

    if (streak >= 90) return { cl: "max", text: isMy ? "Максимальная серия!" : undefined, showCount: true, count: streak };
    if (streak >= 60) return { cl: "comp", text: isMy ? "Эпическое достижение!" : undefined, showCount: true, count: streak };
    if (streak >= 30) return { cl: "month", text: isMy ? "Уверенный прогресс!" : undefined, showCount: true, count: streak };
    if (streak >= 15) return { cl: "half", text: isMy ? "Отличный темп!" : undefined, showCount: true, count: streak };
    if (streak >= 7)  return { cl: "week", text: isMy ? "Да вы в ударе!" : undefined, showCount: true, count: streak };

    return {
        cl: "start",
        text: isMy ? "Начало положено!" : undefined,
        showCount: true,
        count: streak,
    };
};
