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

export const formatScheduleTime = (minutes: number) => {
    if (minutes <= 0 || minutes >= 24 * 60) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};