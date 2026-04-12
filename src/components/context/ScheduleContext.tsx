import { createContext, useState, useMemo, useCallback, type ReactNode } from "react";
import { api } from "../ts/api";
import { useTheHabit } from "../hooks/TheHabitHook";

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

export type ScheduleCompletionType = {
    id: number;
    habit_id: string;
    schedule_id: number;
    date: string;
};

type ScheduleContextType = {
    schedules: SchedulesMap;
    habitSchedule: SchedulesMap;
    loading: boolean;
    refreshSchedules: () => Promise<void>;
    loadHabitSchedule: (habitId: string) => Promise<ScheduleBlockType[]>;
    saveHabitSchedule: (habitId: string, blocksToSend: ScheduleBlockToSend[], isSeparated: boolean) => Promise<boolean>;
    schedule_settings: ScheduleSettingsMap;
    scheduleComplete: (habitId: string, blockId: number, date: string) => Promise<void>;
    scheduleCompletions: ScheduleCompletionType[];
};

/**
 * Контекст расписаний привычек.
 * Предоставляет данные о расписании, настройках и завершённых блоках.
 */
const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
    const { habitSettings, loadHabit } = useTheHabit();

    const [schedules, setSchedules] = useState<SchedulesMap>({});
    const [habitSchedule, setHabitSchedule] = useState<SchedulesMap>({});
    const [loading, setLoading] = useState(true);
    const [schedule_settings, setSchedule_Settings] = useState<ScheduleSettingsMap>({});
    const [scheduleCompletions, setScheduleCompletions] = useState<ScheduleCompletionType[]>([]);

    /**
     * Загружает общее расписание для всех привычек текущего пользователя.
     * Обновляет `schedules` и `schedule_settings`.
     */
    const refreshSchedules = useCallback(async () => {
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
    }, []);

    /**
     * Получает список завершённых блоков расписания для конкретной привычки.
     * @param habitId - ID привычки
     */
    const scheduleGetCompletions = useCallback(async (habitId: string) => {
        if (habitSettings.metric_type !== "schedule" && !habitSettings.schedule) return;

        try {
            const res = await api.get(`/schedule/complete/${habitId}`);
            if (res.data.success) {
                setScheduleCompletions(res.data.completions ?? []);
                console.log("completions:", res.data.completions)
            }
        } catch (e) {
            console.error(e);
        }
    }, [habitSettings.metric_type, habitSettings.schedule]);

    /**
     * Загружает расписание одной привычки + её завершённые блоки.
     * @param habitId - ID привычки
     * @returns Массив блоков расписания
     */
    const loadHabitSchedule = useCallback(async (habitId: string): Promise<ScheduleBlockType[]> => {
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

                await scheduleGetCompletions(habitId);
                return blocks;
            }
            return [];
        } catch (err) {
            console.error(`Ошибка загрузки привычки ${habitId}:`, err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [scheduleGetCompletions]);

    /**
     * Сохраняет изменения в расписании привычки.
     * @param habitId - ID привычки
     * @param blocksToSend - Массив блоков для сохранения
     * @param isSeparated - Флаг разделения по неделям
     * @returns `true` если сохранение прошло успешно
     */
    const saveHabitSchedule = useCallback(async (
        habitId: string,
        blocksToSend: ScheduleBlockToSend[],
        isSeparated: boolean
    ): Promise<boolean> => {
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
    }, [loadHabitSchedule]);

    /**
     * Переключает (toggle) статус завершения блока расписания.
     * После успешного запроса обновляет список завершений.
     * Оптимистичное обновление.
     * @param habitId - ID привычки
     * @param blockId - ID блока расписания
     * @param date - Дата в формате строки (YYYY-MM-DD)
     */
    const scheduleComplete = useCallback(async (
        habitId: string,
        blockId: number,
        date: string
    ) => {

        // 1. мгновенно меняем UI
        setScheduleCompletions(prev => {
            const exists = prev.some(
                c => c.schedule_id === blockId && c.date === date
            );

            if (exists) {
                return prev.filter(
                    c => !(c.schedule_id === blockId && c.date === date)
                );
            }

            return [
                ...prev,
                {
                    id: Date.now(),
                    habit_id: habitId,
                    schedule_id: blockId,
                    date
                }
            ];
        });

        try {
            const res = await api.post("/schedule/complete", {
                habit_id: habitId,
                blockId,
                date
            });
            if (res.data.success) {
                await loadHabit(habitId)
            }
        } catch (e) {
            console.error(e);
        } finally {
            await scheduleGetCompletions(habitId);
        }
    }, [scheduleGetCompletions]);

    const value = useMemo(() => ({
        schedules,
        habitSchedule,
        loading,
        refreshSchedules,
        loadHabitSchedule,
        saveHabitSchedule,
        schedule_settings,
        scheduleComplete,
        scheduleCompletions
    }), [
        schedules,
        habitSchedule,
        loading,
        refreshSchedules,
        loadHabitSchedule,
        saveHabitSchedule,
        schedule_settings,
        scheduleComplete,
        scheduleCompletions
    ]);

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

export default ScheduleContext;