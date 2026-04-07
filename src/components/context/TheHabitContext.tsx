import { createContext, useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { useCalendar } from "../hooks/CalendarHook";
import axios from "axios";
import { useNavigate } from "react-router";

const TheHabitContext = createContext<TheHabitContextType | null>(null);

export interface TheHabitContextType {
    loadHabit: (id: string | null) => Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findHabit: (id: string | null) => Promise<any>; // можно уточнить позже
    loadHabitWLoading: (id: string | null) => Promise<void>;
    loadTimer: (id: number) => void;
    loadCounter: (id: number) => void;
    loadingHabit: boolean;
    habit: Habit | undefined;
    isReadOnly: boolean;
    isDone: boolean | null;
    todayDone: boolean;
    setIsDone: Dispatch<SetStateAction<boolean | null>>;
    dayComment: string | null;
    todayComment: string;
    setDayComment: Dispatch<SetStateAction<string | null>>;
    doable: boolean;
    setDoable: Dispatch<SetStateAction<boolean>>;
    habitSettings: HabitSettings;
    habitTimer: habitTimer | null;
    setHabitTimer: React.Dispatch<SetStateAction<habitTimer | null>>;
    showTimer: habitTimer | null;
    setShowTimer: React.Dispatch<SetStateAction<habitTimer | null>>;
    habitCounter: habitCounter | null;
    setHabitCounter: React.Dispatch<SetStateAction<habitCounter | null>>;
    showCounter: habitCounter | null;
    setShowCounter: React.Dispatch<SetStateAction<habitCounter | null>>;
    counterSettings: counterSettingsType | null;
}

export interface habitTimer {
    id: number;
    started_at: Date;
    end_at: Date;
    status: "running" | "paused" | "ended";
    pauses: { start: string; time: string; end: string | null }[];
    circles: { time: string; text: string | null }[];
}

export interface habitCounter {
    id: number;
    started_at: Date;
    count: number;
    progression: { count: string; time: Date; text: string }[];
    min_count: number;
}

export interface counterSettingsType {
    id: number;
    min_count: number;
    red_counter_right: number;
    red_counter_left: number;
}

export interface HabitSettings {
    metric_type: "timer" | "counter";
    schedule: boolean;
}

// ==================== ПАРСЕРЫ ====================

const parseTimer = (timer: habitTimer): habitTimer | null => {
    if (!timer) return null;
    return {
        id: timer.id,
        started_at: new Date(timer.started_at),
        end_at: new Date(timer.end_at),
        status: timer.status,
        pauses: timer.pauses || [],
        circles: timer.circles || []
    };
};

const parseCounter = (counter: habitCounter): habitCounter | null => {
    if (!counter) return null;
    return {
        id: counter.id,
        started_at: new Date(counter.started_at),
        count: counter.count,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progression: (counter.progression || []).map((item: any) => ({
            count: item.count,
            time: new Date(item.time),
            text: item.text
        })),
        min_count: counter.min_count
    };
};

// =================================================

export const TheHabitProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();
    const { fetchCalendarHabit } = useCalendar();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [loadingHabit, setLoadingHabit] = useState(false);
    const [habit, setHabit] = useState<Habit | undefined>(undefined);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isDone, setIsDone] = useState<boolean | null>(null);
    const [todayDone, setTodayDone] = useState(false);
    const [doable, setDoable] = useState(true);
    const [dayComment, setDayComment] = useState<string | null>(null);
    const [todayComment, setTodayComment] = useState<string>("");
    const [habitTimer, setHabitTimer] = useState<habitTimer | null>(null);
    const [showTimer, setShowTimer] = useState<habitTimer | null>(null);
    const [habitCounter, setHabitCounter] = useState<habitCounter | null>(null);
    const [showCounter, setShowCounter] = useState<habitCounter | null>(null);
    const [counterSettings, setCounterSettings] = useState<counterSettingsType | null>(null);
    const [habitSettings, setHabitSettings] = useState<HabitSettings>({
        metric_type: "timer",
        schedule: false
    });

    /** Найти привычку (используется в списках) */
    const findHabit = async (id: string | null) => {
        if (!id) return null;
        try {
            const res = await api.get(`${API_URL}habits/${id}`);
            const data = res.data;

            if (data.success) {
                return {
                    ...data,
                    timer: parseTimer(data.timer),
                    counter: parseCounter(data.counter)
                };
            }
            return data;
        } catch (err) {
            console.error(err);
            if (axios.isAxiosError(err)) {
                showNotification("error", err.response?.data?.error);
            }
            throw err;
        }
    };

    const loadHabit = async (id: string | null) => {
        if (!id) return;
        try {
            const res = await findHabit(id);
            if (!res?.success) return;

            const { habit: habitData, isRead, isDone: doneToday, comment, settings, counterSettings: cSettings } = res;

            fetchCalendarHabit(id);
            setHabit(habitData);
            setIsReadOnly(isRead);
            setTodayDone(doneToday);
            setTodayComment(comment || "");
            setHabitSettings(settings);
            setCounterSettings(cSettings);
            setHabitCounter(res.counter);
            setHabitTimer(res.timer);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                showNotification("error", err.response?.data?.error);
                if (err.response?.status === 403) {
                    navigate(-1);
                }
            }
        }
    };

    const loadTimer = useCallback(async (habit_id: number) => {
        try {
            const res = await api.get(`${API_URL}timer/${habit_id}`);
            if (res.data.success) {
                setHabitTimer(parseTimer(res.data.timer));
            }
        } catch (error) {
            console.error(error);
        }
    }, [API_URL]);

    const loadCounter = useCallback(async (habit_id: number) => {
        try {
            const res = await api.get(`${API_URL}counter/${habit_id}`);
            if (res.data.success) {
                setHabitCounter(parseCounter(res.data.counter));
            }
        } catch (error) {
            console.error(error);
        }
    }, [API_URL]);

    const loadHabitWLoading = async (id: string | null) => {
        setLoadingHabit(true);
        await loadHabit(id);
        setLoadingHabit(false);
    };

    return (
        <TheHabitContext.Provider
            value={{
                loadHabit,
                findHabit,
                loadHabitWLoading,
                loadTimer,
                loadCounter,
                loadingHabit,
                habit,
                isReadOnly,
                isDone,
                setIsDone,
                dayComment,
                todayComment,
                setDayComment,
                todayDone,
                setDoable,
                doable,
                habitSettings,
                habitTimer,
                setHabitTimer,
                showTimer,
                setShowTimer,
                habitCounter,
                setHabitCounter,
                showCounter,
                setShowCounter,
                counterSettings,
            }}
        >
            {children}
        </TheHabitContext.Provider>
    );
};

export default TheHabitContext;