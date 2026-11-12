import { FireIcon, PathIcon } from "@phosphor-icons/react";
import type { Calendar } from "../context/CalendarContext";
import type { Habit } from "../context/HabitsContext";
import type { OneOffPlan } from "../context/PlansContext";
import { shiftCalendarDay, todayStrFunc } from "./utils/dateToStr";
import { getStreakView } from "../../pages/HabitPage/utils/getStreakView";
import "../../scss/ActivityIndicators.scss";

export type HabitDayProgress = { completed: number; total: number };
export type HabitDayProgressMap = Record<string, HabitDayProgress>;

export function getHabitStreakBadge(habit: Habit, calendar: Calendar[], today = todayStrFunc()) {
    if (!habit.ongoing || !["everyday", "weekly"].includes(habit.periodicity) ||
        habit.periodicity === "weekly" && !habit.chosen_days?.length) return null;
    const doneDates = new Set(calendar.filter(record => record.isDone && Number(record.habitId) === habit.id)
        .map(record => record.date));
    const start = habit.start_date;
    const scheduled = (day: string) => habit.periodicity === "everyday" ||
        habit.chosen_days?.includes(new Date(day + "T12:00:00").getDay()) === true;
    const countFrom = (from: string) => {
        let count = 0;
        let day = from;
        // Protect rendering from accidentally malformed dates or endless loops.
        for (let i = 0; i < 4000 && day >= start; i++) {
            if (scheduled(day)) {
                if (!doneDates.has(day)) break;
                count++;
            }
            day = shiftCalendarDay(day, -1);
        }
        return count;
    };
    const streak = countFrom(today);
    const untilYesterday = countFrom(shiftCalendarDay(today, -1));
    const todayScheduled = scheduled(today);
    const warn = todayScheduled && !doneDates.has(today) && untilYesterday > 0;
    const view = getStreakView(habit, streak, untilYesterday, true, warn, todayScheduled);
    return view?.showCount && view.count > 0 ? { count: view.count, level: view.cl } : null;
}

export default function ActivityIndicators({ habit, plan, calendar, progress, part = "all" }: {
    habit?: Habit;
    plan?: OneOffPlan;
    calendar?: Calendar[];
    progress?: HabitDayProgress;
    part?: "streak" | "aside" | "all";
}) {
    const showStreak = part !== "aside";
    const showAside = part !== "streak";
    const streak = showStreak && habit && calendar ? getHabitStreakBadge(habit, calendar) : null;
    const shared = showAside && habit && progress && (progress.total > 1 || Boolean(habit.chat_id));
    if (!streak && !(showStreak && plan) && !shared) return null;
    return <span className={`activityIndicators ${part === "streak" ? "activityIndicatorsInline" : "activityIndicatorsTrailing"}`}>
        {streak && <span className={`activityStreak ${streak.level}`} title={String(streak.count)}>
            <FireIcon weight="fill" size={17} aria-hidden="true"/>
            <span>{streak.count}</span>
        </span>}
        {showStreak && plan && <PathIcon className="activityPlanPath" size={18} aria-hidden="true"/>}
        {shared && <span className="activityMembersCount">{progress.completed}/{progress.total}</span>}
    </span>;
}
