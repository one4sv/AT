import type { Habit } from "../../../components/context/HabitsContext";
import i18n from "../../../i18n/i18n";

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
            text: i18n.t("habitPageUi.streak.unavailable", { ns: "common" }),
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
            text: isMy ? i18n.t("habitPageUi.streak.restToday", { ns: "common" }) : i18n.t("habitPageUi.streak.restDay", { ns: "common" }),
            showCount: true,
            count: streak,
        };
    }

    if (showYesterdayWarning) {
        return {
            cl: "warn",
            text: isMy ? i18n.t("habitPageUi.streak.keepStreak", { ns: "common" }) : i18n.t("habitPageUi.streak.notCompleted", { ns: "common" }),
            showCount: true,
            count: streakUntilYesterday,
        };
    }

    if (streak === 0) {
        return {
            cl: "null",
            text: isMy ? i18n.t("habitPageUi.streak.neverTooLate", { ns: "common" }) : i18n.t("habitPageUi.streak.zero", { ns: "common" }),
            showCount: false,
            count:0
        };
    }

    if (streak >= 90) return { cl: "max", text: isMy ? i18n.t("habitPageUi.streak.maximum", { ns: "common" }) : undefined, showCount: true, count: streak };
    if (streak >= 60) return { cl: "comp", text: isMy ? i18n.t("habitPageUi.streak.epic", { ns: "common" }) : undefined, showCount: true, count: streak };
    if (streak >= 30) return { cl: "month", text: isMy ? i18n.t("habitPageUi.streak.progress", { ns: "common" }) : undefined, showCount: true, count: streak };
    if (streak >= 15) return { cl: "half", text: isMy ? i18n.t("habitPageUi.streak.pace", { ns: "common" }) : undefined, showCount: true, count: streak };
    if (streak >= 7)  return { cl: "week", text: isMy ? i18n.t("habitPageUi.streak.onFire", { ns: "common" }) : undefined, showCount: true, count: streak };

    return {
        cl: "start",
        text: isMy ? i18n.t("habitPageUi.streak.started", { ns: "common" }) : undefined,
        showCount: true,
        count: streak,
    };
};
