import { createContext, useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react";
import { api } from "../ts/api";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useHabits } from "../hooks/HabitsHook";
import axios from "axios";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";

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

export type ScheduleContextType = {
    /** 
     * Общее расписание всех привычек пользователя.
     * Ключ — ID привычки, значение — массив блоков расписания.
     */
    schedules: SchedulesMap;

    /** 
     * Расписание конкретных привычек (кэш).
     * Ключ — ID привычки.
     */
    habitSchedule: SchedulesMap;

    /** 
     * Флаг загрузки (используется для UI).
     */
    loading: boolean;

    /**
     * Загружает общее расписание всех привычек пользователя.
     * Обновляет `schedules` и `schedule_settings`.
     * @returns Promise<void>
     */
    refreshSchedules(): Promise<void>;

    /**
     * Загружает расписание одной привычки и её completion-данные.
     * @param habitId ID привычки
     * @returns Массив блоков расписания
     */
    loadHabitSchedule(habitId: string): Promise<ScheduleBlockType[]>;

    /**
     * Сохраняет изменения в расписании привычки.
     * @param habitId ID привычки
     * @param blocksToSend Массив блоков для сохранения
     * @param isSeparated Флаг разделения по неделям
     * @returns true если сохранение прошло успешно
     */
    saveHabitSchedule(
        habitId: string,
        blocksToSend: ScheduleBlockToSend[],
        isSeparated: boolean
    ): Promise<boolean>;

    /**
     * Настройки расписания для привычек.
     * Ключ — ID привычки.
     */
    schedule_settings: ScheduleSettingsMap;

    /**
     * Переключает (toggle) статус завершения блока расписания.
     * Делает оптимистичное обновление UI и синхронизацию с сервером.
     * @param habitId ID привычки
     * @param blockId ID блока расписания
     * @param date Дата в формате (YYYY-MM-DD)
     * @returns Promise<void>
     */
    scheduleComplete(habitId: string, blockId: number, date: string): Promise<void>;

    /**
     * Список выполненных блоков расписания.
     */
    scheduleCompletions: ScheduleCompletionType[];

    /**
     * Показатель Загрузки конкретного блока
     */
    loadingComp: string[];
};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
    const { habitSettings, loadHabit, habit } = useTheHabit();
    const { showNotification } = useNote();
    const pendingCompletions = useRef(new Set<string>());
    const currentHabitRef = useRef(habit?.id);
    currentHabitRef.current = habit?.id;
    const { refetchHabits } = useHabits()
    const { user } = useUser()
    const [ schedules, setSchedules ] = useState<SchedulesMap>({});
    const [ habitSchedule, setHabitSchedule ] = useState<SchedulesMap>({});
    const [ loading, setLoading ] = useState(true);
    const [ schedule_settings, setSchedule_Settings ] = useState<ScheduleSettingsMap>({});
    const [ scheduleCompletions, setScheduleCompletions ] = useState<ScheduleCompletionType[]>([]);
    const [ loadingComp, setLoadingComp ] = useState<string[]>([])
    const completionsRef = useRef(scheduleCompletions);
    completionsRef.current = scheduleCompletions;
    const userRef = useRef(user.id);
    userRef.current = user.id;

    useEffect(() => {
        setSchedules({});
        setHabitSchedule({});
        setSchedule_Settings({});
        setScheduleCompletions([]);
        setLoadingComp([]);
        pendingCompletions.current.clear();
    }, [user.id]);
    
    const refreshSchedules = useCallback(async () => {
        if (!user.id) return
        setLoading(true);
        try {
            const res = await api.get("/schedule");
            if (res.data.success) {
                setSchedules(res.data.schedules || {});
                setSchedule_Settings(res.data.settings || {});
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) return;
            }
            console.error("Ошибка загрузки общего расписания:", err);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    const scheduleGetCompletions = useCallback(async (habitId: string) => {
        if (habitSettings.metric_type !== "schedule" && !habitSettings.schedule) return;

        try {
            const requestUser = userRef.current;
            const res = await api.get(`/schedule/complete/${habitId}`);
            if (userRef.current !== requestUser) return;
            if (res.data.success) {
                setScheduleCompletions(previous => [...previous.filter(block => String(block.habit_id) !== habitId), ...(res.data.completions ?? [])]);
            }
        } catch (e) {
            console.error(e);
        }
    }, [habitSettings.metric_type, habitSettings.schedule]);

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

    const scheduleComplete = useCallback(async (habitId: string, blockId: number, date: string) => {
        const key = `${blockId} - ${date}`;
        const requestUser = userRef.current;
        const pendingKey = `${requestUser}:${key}`;
        if (pendingCompletions.current.has(pendingKey)) return;
        pendingCompletions.current.add(pendingKey);
        const previous = completionsRef.current.find(block => String(block.habit_id) === habitId && block.schedule_id === blockId && block.date === date);
        setLoadingComp(items => [...items, key]);
        setScheduleCompletions(items => previous
            ? items.filter(block => !(String(block.habit_id) === habitId && block.schedule_id === blockId && block.date === date))
            : [...items, { id: Date.now(), habit_id: habitId, schedule_id: blockId, date }]);
        try {
            const response = await api.post("/schedule/complete", { habit_id: habitId, blockId, date });
            if (userRef.current !== requestUser) return;
            if (!response.data.success) throw new Error(response.data.error || "Не удалось сохранить выполнение");
            await scheduleGetCompletions(habitId);
            if (String(currentHabitRef.current) === habitId) await loadHabit(habitId);
            await refetchHabits();
        } catch (error) {
            if (userRef.current === requestUser) {
                setScheduleCompletions(items => {
                    const remaining = items.filter(block => !(String(block.habit_id) === habitId && block.schedule_id === blockId && block.date === date));
                    return previous ? [...remaining, previous] : remaining;
                });
                showNotification("error", axios.isAxiosError(error) ? error.response?.data?.error || "Не удалось сохранить выполнение" : error instanceof Error ? error.message : "Не удалось сохранить выполнение");
            }
        } finally {
            pendingCompletions.current.delete(pendingKey);
            if (userRef.current === requestUser) setLoadingComp(items => items.filter(item => item !== key));
        }
    }, [scheduleGetCompletions, loadHabit, refetchHabits, showNotification]);

    const value = useMemo(() => ({
        schedules,
        habitSchedule,
        loading,
        refreshSchedules,
        loadHabitSchedule,
        saveHabitSchedule,
        schedule_settings,
        scheduleComplete,
        scheduleCompletions,
        loadingComp
    }), [
        schedules,
        habitSchedule,
        loading,
        refreshSchedules,
        loadHabitSchedule,
        saveHabitSchedule,
        schedule_settings,
        scheduleComplete,
        scheduleCompletions,
        loadingComp
    ]);

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

export default ScheduleContext;