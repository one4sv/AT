import { api } from "../../../components/ts/api";
import { useTheHabit } from "../../../components/hooks/TheHabitHook";
import { useHabits } from "../HabitsHook";

export const useHabitTimer = () => {
    const { refetchHabits } = useHabits();
    const { habit, habitTimer, loadTimer, loadHabit } = useTheHabit();
    const API_URL = import.meta.env.VITE_API_URL;

    const isTimer = habitTimer !== null;

    const timerStart = async () => {
        if (!habit) return;
        try {
            const res = await api.post(`${API_URL}timer/start`, {
                habit_id: habit.id,
                time: new Date(),
                timer_id: isTimer ? habitTimer?.id : null
            });

            if (res.data.success) {
                loadTimer(habit.id);
                refetchHabits();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const timerPause = async () => {
        if (!habit) return;

        const res = await api.post(`${API_URL}timer/pause`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: habitTimer?.id
        });

        if (res.data.success) {
            loadTimer(habit.id);
            refetchHabits()
        }
    };

    const timerStop = async () => {
        if (!habit) return;

        const res = await api.post(`${API_URL}timer/stop`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: habitTimer?.id
        });

        if (res.data.success) {
            loadTimer(habit.id);
            loadHabit(String(habit.id));
            refetchHabits()
        }
    };

    const timerCircle = async () => {
        if (!habit) return;

        const res = await api.post(`${API_URL}timer/circle`, {
            habit_id: habit.id,
            time: new Date(),
            timer_id: habitTimer?.id
        });

        if (res.data.success) {
            loadTimer(habit.id);
        }
    };

    return {
        timerStart,
        timerPause,
        timerStop,
        timerCircle
    };
};