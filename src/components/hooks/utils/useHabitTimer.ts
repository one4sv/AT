import { api } from "../../../components/ts/api";
import { useTheHabit } from "../../../components/hooks/TheHabitHook";
import { useHabits } from "../HabitsHook";

export const useHabitTimer = () => {
    const { habit, habitTimer, loadHabit } = useTheHabit();
    const { refetchHabits } = useHabits()
    const API_URL = import.meta.env.VITE_API_URL;

    const isTimer = habitTimer !== null;

    const timerStart = async () => {
        if (!habit) return;

        await api.post(`${API_URL}timer/start`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: isTimer ? habitTimer?.id : null
        });
    };

    const timerPause = async () => {
        if (!habit) return;

        await api.post(`${API_URL}timer/pause`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: habitTimer?.id
        });
    };

    const timerStop = async () => {
        if (!habit) return;

        const res = await api.post(`${API_URL}timer/stop`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: habitTimer?.id
        });
        if (res.data.success) {
            await loadHabit(String(habit.id))
            await refetchHabits()
        }
    };

    const timerCircle = async () => {
        if (!habit) return;

        await api.post(`${API_URL}timer/circle`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: habitTimer?.id
        });
    };

    return { timerStart, timerPause, timerStop, timerCircle };
};