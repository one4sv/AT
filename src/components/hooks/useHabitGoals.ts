import { useGoalsWorkspace } from "./useGoalsWorkspace";

export const hasHabitGoalLink = (goal: { habit_ids?: number[] }, habitId: number | undefined) =>
    habitId !== undefined && (goal.habit_ids || []).some(id => String(id) === String(habitId));

export function useHabitGoals(habitId: number | undefined, enabled: boolean) {
    const {goals,loading,error}=useGoalsWorkspace(enabled && habitId !== undefined);
    const linked=goals.filter(goal=>hasHabitGoalLink(goal,habitId));
    return {goals,linked,loading,error};
}
