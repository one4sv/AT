import { todayStrFunc, clockInAppZone } from "./dateToStr";
import type { Habit } from "../../context/HabitsContext";
import type { OneOffPlan } from "../../context/PlansContext";

export const isGoalHabitAvailable = (habit: Habit, userId: string | null | undefined) =>
    Boolean(userId && habit.ongoing === true && habit.goal_scope!=="shared" && (habit.user_id===userId || habit.access?.is_member || !habit.access));

export function isGoalPlanAvailable(plan: OneOffPlan) {
    if (!plan.is_owner || plan.status !== "upcoming") return false;
    const day = todayStrFunc();
    const clock = clockInAppZone();
    const cutoff = (plan.end_time || plan.start_time || "").slice(0, 5);
    return plan.plan_date > day || (plan.plan_date === day && (!cutoff || cutoff > clock));
}
