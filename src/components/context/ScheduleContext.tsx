import { createContext, useState, type ReactNode } from "react";
import { api } from "../ts/api";

export type ScheduleBlockType = {
    id: number;
    day_of_week: number;
    isSeparator: boolean;
    name: string;
    start_time: string;
    end_time: string;
};

export type RawScheduleBlock = {
    id: number;
    day_of_week: number | string;
    isSeparator: boolean;
    name: string | null;
    start_time: string | null;
    end_time: string | null;
};

type ScheduleBlockToSend = {
    id?: number;
    day_of_week: number;
    isSeparator: boolean;
    name: string;
    start_time: string | null;
    end_time: string | null;
};

export type SchedulesMap = Record<string, ScheduleBlockType[]>;

export type ScheduleSettingsType = {
    habit_id: number;
    isSeparated: boolean;
    color: boolean;
};

export type ScheduleSettingsMap = Record<string, ScheduleSettingsType | null>;

type ScheduleContextType = {
    schedules: SchedulesMap;
    habitSchedule: SchedulesMap;
    loading: boolean;
    refreshSchedules: () => Promise<void>;
    loadHabitSchedule: (habitId: string) => Promise<ScheduleBlockType[]>;
    saveHabitSchedule: (habitId: string, blocksToSend: ScheduleBlockToSend[], isSeparated: boolean) => Promise<boolean>;
    schedule_settings: ScheduleSettingsMap;   // ← теперь Record
};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
    const [schedules, setSchedules] = useState<SchedulesMap>({});
    const [habitSchedule, setHabitSchedule] = useState<SchedulesMap>({});
    const [loading, setLoading] = useState(false);
    const [schedule_settings, setSchedule_Settings] = useState<ScheduleSettingsMap>({});

    const refreshSchedules = async () => {
        setLoading(true);
        try {
            const res = await api.get("/schedule");
            if (res.data.success) {
                setSchedules(res.data.schedules || {});
                setSchedule_Settings(res.data.settings || {});
            }
        } catch (err) {
            console.error("Ошибка загрузки общего расписания:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadHabitSchedule = async (habitId: string): Promise<ScheduleBlockType[]> => {
        setLoading(true);
        try {
            const res = await api.get(`/schedule/${habitId}`);
            if (res.data.success && res.data.blocks) {
                const blocks = res.data.blocks.map((b: RawScheduleBlock) => ({
                    id: b.id,
                    day_of_week: Number(b.day_of_week),
                    isSeparator: Boolean(b.isSeparator),
                    name: b.name || "",
                    start_time: b.start_time || "",
                    end_time: b.end_time || ""
                }));
                setHabitSchedule(prev => ({ ...prev, [habitId]: blocks }));
                setSchedule_Settings(prev => ({
                    ...prev,
                    [habitId]: res.data.settings ?? null
                }));

                return blocks;
            }
            return [];
        } catch (err) {
            console.error(`Ошибка загрузки привычки ${habitId}:`, err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const saveHabitSchedule = async (habitId: string, blocksToSend: ScheduleBlockToSend[], isSeparated: boolean): Promise<boolean> => {
        setLoading(true);
        try {
            const res = await api.post("/schedule", { habit_id: parseInt(habitId), blocks: blocksToSend, isSeparated });
            if (res.data.success) {
                await loadHabitSchedule(habitId);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Ошибка сохранения:", err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScheduleContext.Provider value={{
            schedules,
            habitSchedule,
            loading,
            refreshSchedules,
            loadHabitSchedule,
            saveHabitSchedule,
            schedule_settings
        }}>
            {children}
        </ScheduleContext.Provider>
    );
};

export default ScheduleContext;