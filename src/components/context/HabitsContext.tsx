import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import { useSettings } from "../hooks/SettingsHook";

export interface Habit {
    id:number;
    name: string;
    desc:string | "";
    start_date: string;
    end_date: string | "" | Date;
    ongoing: boolean;
    periodicity: string;
    chosen_days: number[] | null;
    start_time:string | "";
    end_time:string | "";
    created_at:Date;
    tag:string | "";
    pinned:boolean;
    done?:boolean;
    user_id:string;
}

interface HabitResponse {
    success: boolean;
    habitsArr?: Habit[];
    error?: string;
    cookie?: boolean;
}

export interface HabitContextType {
    habits: Habit[] | null;
    loadingHabits: boolean;
    refetchHabits: () => Promise<void>;
    refetchHabitsWLoading: () => Promise<void>;
    newOrderHabits: string[] | undefined;
}

const HabitsContext = createContext<HabitContextType | null>(null);

export const HabitsProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();
    const { orderHabits } = useSettings();
    const API_URL = import.meta.env.VITE_API_URL

    const [ habits, setHabits ] = useState<Habit[] | null>(null);
    const [ loadingHabits, setLoadingHabits ] = useState(true);
    const [ newOrderHabits, setNewOrderHabits ] = useState<string[] | undefined>()

    const refetchHabits = useCallback(async () => {
        try {
            const res = await axios.get<HabitResponse>(`${API_URL}habits`, {
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
            setLoadingHabits(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refetchHabitsWLoading = async() => {
        setLoadingHabits(true);
        await refetchHabits()
    }
    useEffect(() => {
        refetchHabitsWLoading();
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
        <HabitsContext.Provider value={{ habits, loadingHabits, refetchHabits, newOrderHabits, refetchHabitsWLoading }}>
        {children}
        </HabitsContext.Provider>
    );
};

export default HabitsContext;
