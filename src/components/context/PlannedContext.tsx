import { createContext, useState, type ReactNode } from "react";
import { api } from "../ts/api";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useHabits } from "../hooks/HabitsHook";

const PlannedContext = createContext<PlannedContextType | null>(null);

export interface PlannedContextType {
    markPlan: (id: number, date: string) => void;
    markPlanWLoading: (id: number, date: string) => void;
    waitPlanAnswer: boolean;
}

export const PlannedProvider = ( { children } : { children:ReactNode } ) => {
    const { habit, loadHabit } = useTheHabit()
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const { refetchHabits } = useHabits()
    const [ waitPlanAnswer, setWaitPlanAnswer ] = useState(false)

    const API_URL = import.meta.env.VITE_API_URL;

    const markPlan = async (id: number, date: string) => {
        setWaitPlanAnswer(true)
        try {
            const res = await api.post(`${API_URL}markplan`, {habit_id:id, date})
            if (res.data.success) {
                if (habit && habit.id === Number(id)) {
                    loadHabit(id.toString());
                    fetchCalendarHabit(id.toString());
                }
                if (!habit || habit.id === Number(id)) fetchCalendarUser();
            }
        } catch (err) {
            console.error("markDone error", err);
        } finally {
            refetchHabits();
            setWaitPlanAnswer(false);
        }
    }

    const markPlanWLoading = async (id: number, date: string) => {
        setWaitPlanAnswer(true);
        await markPlan(id, date);
    };
    return (
        <PlannedContext.Provider
            value={{ markPlan, markPlanWLoading, waitPlanAnswer }}
        >
            {children}
        </PlannedContext.Provider>
    );
}

export default PlannedContext