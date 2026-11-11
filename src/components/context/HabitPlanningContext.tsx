import { createContext, useState, type ReactNode } from "react";
import { api } from "../ts/api";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useHabits } from "../hooks/HabitsHook";

const HabitPlanningContext = createContext<HabitPlanningContextType | null>(null);

export interface HabitPlanningContextType {
    markHabitPlannedDay: (id: number, date: string) => void;
    markHabitPlannedDayWLoading: (id: number, date: string) => void;
    waitPlanAnswer: boolean;
}

export const HabitPlanningProvider = ( { children } : { children:ReactNode } ) => {
    const { habit, loadHabit } = useTheHabit()
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const { refetchHabits } = useHabits()
    const [ waitPlanAnswer, setWaitPlanAnswer ] = useState(false)

    const markHabitPlannedDay = async (id: number, date: string) => {
        setWaitPlanAnswer(true)
        try {
            const res = await api.post(`markplan`, {habit_id:id, date})
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

    const markHabitPlannedDayWLoading = async (id: number, date: string) => {
        setWaitPlanAnswer(true);
        await markHabitPlannedDay(id, date);
    };
    return (
        <HabitPlanningContext.Provider
            value={{ markHabitPlannedDay, markHabitPlannedDayWLoading, waitPlanAnswer }}
        >
            {children}
        </HabitPlanningContext.Provider>
    );
}

export default HabitPlanningContext