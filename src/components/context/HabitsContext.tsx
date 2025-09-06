import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import { useSettings } from "../hooks/SettingsHook";

export interface Habit {
    id:number;
    name: string;
    desc:string | "";
    start_date: string | Date;
    end_date: string | "" | Date;
    ongoing: boolean;
    periodicity: string;
    chosen_days: number[] | null;
    start_time:string | "";
    end_time:string | "";
    created_at:Date;
    tag:string | "";
    pinned:boolean;
}

interface HabitResponse {
    success: boolean;
    habitsArr?: Habit[];
    error?: string;
    cookie?: boolean;
}

export interface HabitContextType {
    habits: Habit[] | null;
    loadingHabit: boolean;
    refetchHabits: () => Promise<void>;
    newOrderHabits: string[] | undefined;
}

const HabitsContext = createContext<HabitContextType | null>(null);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();
    const { orderHabits } = useSettings();

    const [ habits, setHabits ] = useState<Habit[] | null>(null);
    const [ loadingHabit, setLoadingHabit ] = useState(true);
    const [ newOrderHabits, setNewOrderHabits ] = useState<string[] | undefined>()

    const refetchHabits = useCallback(async () => {
        setLoadingHabit(true);
        try {
            const res = await axios.get<HabitResponse>("http://localhost:3001/habits", {
                withCredentials: true,
            });

            if (res.data.success && res.data.habitsArr) {
                setHabits(res.data.habitsArr);
            } else {
                setHabits(null);
            }
        } catch (err) {
            setHabits(null);
            if (axios.isAxiosError(err)) {
                if (err.response?.status !== 401 && err.response?.status !== 403) {
                showNotification("error", err.response?.data?.error || "Ошибка запроса");
                }
            }
            } finally {
            setLoadingHabit(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        refetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        const weekOrder: string[] = [];
        
        weekOrder.push("today");
        weekOrder.push("tomorrow");

        for (let i = 2; i <= 6; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            weekOrder.push(`${yyyy}-${mm}-${dd}`);
        }

        if (!orderHabits || weekOrder.length === 0) return;
        let newOrder = orderHabits.flatMap(item => item === "weekly" ? weekOrder : [item]);
        if (habits?.find(h => h.pinned)) newOrder = ["pinned", ...newOrder]
        const isSame = newOrder.length === orderHabits.length &&
            newOrder.every((val, i) => val === orderHabits[i]);

        if (!isSame) {
            setNewOrderHabits(newOrder);
        }
    }, [habits, orderHabits]);

    return (
        <HabitsContext.Provider value={{ habits, loadingHabit, refetchHabits, newOrderHabits }}>
        {children}
        </HabitsContext.Provider>
    );
};

export default HabitsContext;
