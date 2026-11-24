import type { Habit } from "../../context/HabitsContext";
import type { OneOffPlan } from "../../context/PlansContext";

export const isGoalHabitAvailable = (habit: Habit, userId: string | null | undefined) =>
    habit.user_id === userId && habit.ongoing === true;

export function isGoalPlanAvailable(plan: OneOffPlan) {
    if (!plan.is_owner || plan.status !== "upcoming") return false;
    const now = new Date();
    const day = now.toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
    const clock = now.toLocaleTimeString("en-GB", { timeZone: "Europe/Moscow", hourCycle: "h23" }).slice(0, 5);
    const cutoff = (plan.end_time || plan.start_time || "").slice(0, 5);
    return plan.plan_date > day || (plan.plan_date === day && (!cutoff || cutoff > clock));
}
