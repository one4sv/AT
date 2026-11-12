import type { Habit } from "../../context/HabitsContext";
import type { Calendar } from "../../context/CalendarContext";
import type { OneOffPlan } from "../../context/PlansContext";
import { getDayArrays } from "./getDayArrs";
import { shiftCalendarDay, todayStrFunc } from "./dateToStr";

export type DayEntry = {
    key: string;
    kind: "habit" | "plan";
    name: string;
    start: string | null;
    end: string | null;
    date: string;
    description: string;
    completed: boolean;
    state: "comp" | "skip" | "now" | "will";
    habit?: Habit;
    plan?: OneOffPlan;
};
export const timeOf = (value?: string | null) => value?.trim().slice(0, 5) || null;
const groupOf = (entry: DayEntry) => {
    if (entry.habit?.periodicity === "sometimes") return 3;
    return entry.start ? 0 : entry.end ? 1 : 2;
};
export const compareDayEntries = (a: DayEntry, b: DayEntry) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const group = groupOf(a) - groupOf(b);
    if (group) return group;
    const time = (a.start || a.end || "").localeCompare(b.start || b.end || "");
    return time || a.name.localeCompare(b.name) || a.key.localeCompare(b.key);
};
export const describeDayTime = (entry: DayEntry, t: (key: string, options?: Record<string,string>) => string) => {
    if (entry.start && entry.end) return t("habitPageUi.day.fromTo", { start: entry.start, end: entry.end });
    if (entry.start) return t("habitPageUi.day.at", { time: entry.start });
    if (entry.end) return t("habitPageUi.day.until", { time: entry.end });
    if (entry.habit?.periodicity === "sometimes") return t("sideMenu.sometimes");
    return t("plans.noTime");
};
export function makeDayEntries(day: string, habits: Habit[] | null, plans: OneOffPlan[], calendar: Calendar[], includeUnscheduled = false): DayEntry[] {
    const statuses = getDayArrays(day, calendar, habits, undefined, undefined, true);
    const byId = new Map<number, DayEntry>();
    const states: Array<["comp" | "now" | "will" | "skip", Calendar[]]> = [
        ["comp", statuses.completedArr], ["now", statuses.nowArr],
        ["will", statuses.willArr], ["skip", statuses.skippedArr]
    ];
    for (const [state, rows] of states) {
        for (const row of rows) {
            const habit = habits?.find(h => h.id === Number(row.habitId));
            if (!habit || byId.has(habit.id)) continue;
            byId.set(habit.id, {
                key: "habit-" + habit.id, kind: "habit", name: habit.name,
                start: timeOf(habit.start_time), end: timeOf(habit.end_time),
                date: day, description: habit.desc || "", completed: state === "comp", state, habit
            });
        }
    }
    if (includeUnscheduled) {
        for (const habit of habits || []) {
            if (!habit.ongoing || byId.has(habit.id)) continue;
            byId.set(habit.id, {
                key: "habit-" + habit.id, kind: "habit", name: habit.name,
                start: timeOf(habit.start_time), end: timeOf(habit.end_time),
                date: day, description: habit.desc || "", completed: false, state: "will", habit
            });
        }
    }
    const planEntries: DayEntry[] = plans.filter(p => p.plan_date === day && p.membership_status !== "pending").map(plan => ({
        key: "plan-" + plan.id, kind: "plan", name: plan.name,
        start: timeOf(plan.start_time), end: timeOf(plan.end_time), date: day,
        description: plan.description || "", completed: Boolean(plan.completed_for_me),
        state: plan.completed_for_me ? "comp" : "will", plan
    }));
    return [...byId.values(), ...planEntries].sort(compareDayEntries);
}
export function makeSideMenuEntries(filter: string | undefined, habits: Habit[] | null, plans: OneOffPlan[],
    calendar: Calendar[], showArchived: boolean, search: string): DayEntry[] {
    const today = todayStrFunc();
    let day = today;
    if (filter === "tomorrow") {
        day = shiftCalendarDay(today, 1);
    } else if (filter && /^\d{4}-\d{2}-\d{2}$/.test(filter)) day = filter;
    let entries: DayEntry[];
    if (filter === "plans") {
        entries = plans.filter(plan => plan.membership_status !== "pending" &&
            plan.status !== "canceled").map(plan => ({
            key: "plan-" + plan.id, kind: "plan" as const, name: plan.name,
            start: timeOf(plan.start_time), end: timeOf(plan.end_time),
            date: plan.plan_date, description: plan.description || "",
            completed: Boolean(plan.completed_for_me),
            state: (plan.completed_for_me ? "comp" : "will") as "comp" | "will", plan
        }));
    } else if (filter === "archived") {
        entries = (habits || []).filter(h => !h.ongoing).map(habit => ({
            key:"habit-"+habit.id, kind:"habit", name:habit.name, start:timeOf(habit.start_time),
            end:timeOf(habit.end_time), date:day, description:habit.desc || "",
            completed:false, state:"skip", habit
        }));
    } else {
        const source = showArchived ? habits : (habits || []).filter(h => h.ongoing);
        entries = makeDayEntries(day, source, plans, calendar, !filter || filter === "all");
        if (!filter || filter === "all") {
            entries.push(...plans.filter(p => p.plan_date > today && p.membership_status !== "pending").map(plan => ({
                key:"plan-"+plan.id, kind:"plan" as const, name:plan.name, start:timeOf(plan.start_time),
                end:timeOf(plan.end_time), date:plan.plan_date, description:plan.description || "",
                completed:Boolean(plan.completed_for_me), state:"will" as const, plan
            })));
        } else if (!["today","tomorrow"].includes(filter) && !/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
            entries = entries.filter(e => e.habit?.periodicity === filter);
        }
    }
    if (search.trim()) entries = entries.filter(e => e.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
    return entries.sort(compareDayEntries);
}
