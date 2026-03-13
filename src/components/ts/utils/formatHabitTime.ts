import type { Habit } from "../../context/HabitsContext";

export const formatHabitTime = (habit:Habit) => {
    const { start_time:st, end_time:et } = habit
    if (st && et && st !== null) {
        return ` с ${st} до ${et}`;
    }
    if (st || et) {
        return st ? ` в ${st}` : ` до ${et}`
    }
    return "";
};