import { useState, createContext, useCallback, type ReactNode } from "react";
import { useHabits } from "../hooks/HabitsHook";
import { useNote } from "../hooks/NoteHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { api } from "../ts/api";
import type { asctype, metricsType } from "./TheHabitContext";
import { todayStrFunc } from "../../pages/HabitPage/utils/dateToStr";

export type UpdateHabitContextType = {
    /** Изменить название привычки */
    setNewName: (habitId: number, val: string) => void;
    /** Изменить описание */
    setNewDescription: (habitId: number, val: string) => void;
    /** Установить флаг "без окончания" — теперь сразу отправляется на сервер */
    setNewOngoing: (habitId: number, val: boolean) => Promise<void>;
    /** Изменить периодичность (например: everyday, weekly) */
    setNewPeriodicity: (habitId: number, val: string | number | null) => void;
    /** Выбрать дни недели */
    setNewDays: (
        habitId: number,
        val: { value: number; label: string; chosen: boolean }[] | null
    ) => void;
    /** Установить время начала */
    setNewStartTime: (habitId: number, val: string | null) => void;
    /** Установить время окончания */
    setNewEndTime: (habitId: number, val: string | null) => void;
    /** Закрепить привычку */
    setPin: (habitId: number, val: boolean) => void;
    /** Установить тег */
    setNewTag: (habitId: number, val: string | null) => void;
    /** Изменить тип метрики (timer, counter и т.д.) */
    setNewMetricType: (habitId: number, val: metricsType) => void;
    /** Включить/выключить расписание */
    setNewScheduleBool: (habitId: number, val: boolean) => void;
    /** Автовыполнение по расписанию*/
    setNewAutoScheduleCompletion: (habitId:number, val: asctype) => void
    /** Список id привычек, которые сейчас сохраняются */
    isUpdating: string[];
    /**
     * Локальные изменения:
     * ключ — habitId,
     * значение — изменённые поля
     */
    localChanges: { [key: number]: Partial<Record<string, unknown>> };
    /**
     * Сохранить изменения привычки на сервер
     * @param habitId ID привычки
     */
    saveHabit: (habitId: number) => Promise<void>;
};

const UpdateHabitContext = createContext<UpdateHabitContextType | null>(null);

export const UpdateHabitProvider = ({ children }: { children: ReactNode }) => {
    const { refetchHabits } = useHabits();
    const { habit, habitSettings, loadHabit } = useTheHabit();
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL;

    const [localChanges, setLocalChanges] = useState<{ [key: number]: Partial<Record<string, unknown>> }>({});
    const [isUpdating, setIsUpdating] = useState<string[]>([]);

    const normalize = (val: unknown) => {
        if (Array.isArray(val)) {
            return [...val].sort();
        }
        return val;
    };

    const isEqual = (a: unknown, b: unknown) => {
        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }
        return JSON.stringify(a) === JSON.stringify(b);
    };

    const updateLocalChanges = useCallback((habitId: number, field: string, value: unknown) => {
        if (field === "name" && (!value || (typeof value === "string" && value.trim() === ""))) return;
        if (field === "start_date" && !value) return;

        let originalValue: unknown;

        if (field === "metric_type" || field === "schedule") {
            originalValue = habitSettings?.[field as keyof typeof habitSettings];
        } else {
            originalValue = habit?.[field as keyof typeof habit];
        }

        setLocalChanges(prev => {
            const habitChanges = { ...(prev[habitId] || {}) };

            if (isEqual(normalize(value), normalize(originalValue))) {
                delete habitChanges[field];
            } else {
                habitChanges[field] = value;
            }

            const updated = { ...prev };

            if (Object.keys(habitChanges).length === 0) {
                delete updated[habitId];
            } else {
                updated[habitId] = habitChanges;
            }

            return updated;
        });
    }, [habit, habitSettings]);

    const setNewName = useCallback((habitId: number, val: string) => updateLocalChanges(habitId, "name", val), [updateLocalChanges]);
    const setNewDescription = useCallback((habitId: number, val: string) => updateLocalChanges(habitId, "desc", val), [updateLocalChanges]);

    const setNewOngoing = useCallback(async (habitId: number, val: boolean) => {
        const endDateValue = val === false ? todayStrFunc() : null;

        updateLocalChanges(habitId, "ongoing", val);
        updateLocalChanges(habitId, "end_date", endDateValue);

        setIsUpdating(prev => [...new Set([...prev, `habit_${habitId}`])]);

        try {
            const habitFields = {
                ongoing: val,
                end_date: endDateValue,
            };

            const res = await api.post(`${API_URL}updatehabit`, {
                habit_id: habitId,
                table: "habits",
                ...habitFields
            });

            if (res.data.success) {
                setLocalChanges(prev => {
                    const updated = { ...prev };
                    if (updated[habitId]) {
                        const habitChanges = { ...updated[habitId] };
                        delete habitChanges.ongoing;
                        delete habitChanges.end_date;

                        if (Object.keys(habitChanges).length === 0) {
                            delete updated[habitId];
                        } else {
                            updated[habitId] = habitChanges;
                        }
                    }
                    return updated;
                });

                refetchHabits();
                loadHabit(String(habitId));
            } else {
                showNotification("error", "Не удалось сохранить ongoing");
            }
        } catch (err) {
            console.error("❌ Ошибка при сохранении ongoing:", err);
            showNotification("error", "Ошибка при сохранении ongoing");
        } finally {
            setIsUpdating(prev => prev.filter(item => item !== `habit_${habitId}`));
        }
    }, [updateLocalChanges, API_URL, refetchHabits, loadHabit, showNotification]);

    const setNewPeriodicity = useCallback((habitId: number, val: string | number | null) => {
        if (typeof val === "string") updateLocalChanges(habitId, "periodicity", val);
    }, [updateLocalChanges]);
    const setNewDays = useCallback((habitId: number, days: { value: number; label: string; chosen: boolean }[] | null) => {
        const val = days?.filter(d => d.chosen).map(d => d.value) || [];
        updateLocalChanges(habitId, "chosen_days", val);
    }, [updateLocalChanges]);
    const setNewStartTime = useCallback((habitId: number, val: string | null) => updateLocalChanges(habitId, "start_time", val), [updateLocalChanges]);
    const setNewEndTime = useCallback((habitId: number, val: string | null) => updateLocalChanges(habitId, "end_time", val), [updateLocalChanges]);
    const setPin = useCallback((habitId: number, val: boolean) => updateLocalChanges(habitId, "pinned", val), [updateLocalChanges]);
    const setNewTag = useCallback((habitId: number, val: string | null) => updateLocalChanges(habitId, "tag", val), [updateLocalChanges]);

    const setNewMetricType = useCallback((habitId: number, val: metricsType) => updateLocalChanges(habitId, "metric_type", val), [updateLocalChanges]);
    const setNewScheduleBool = useCallback((habitId: number, val: boolean) => updateLocalChanges(habitId, "schedule", val), [updateLocalChanges]);
    const setNewAutoScheduleCompletion = useCallback((habitId: number, val: asctype) => updateLocalChanges(habitId, "auto_schedule_completion", val), [updateLocalChanges]);

    const SETTINGS_FIELDS = [
        "metric_type",
        "schedule",
        "auto_schedule_completion"
    ];

    const saveHabit = useCallback(async (habitId: number) => {
        const changes = localChanges[habitId];
        if (!changes || Object.keys(changes).length === 0) return;

        setIsUpdating(prev => [...new Set([...prev, `habit_${habitId}`])]);

        const habitFields: Record<string, unknown> = {};
        const settingsFields: Record<string, unknown> = {};

        Object.entries(changes).forEach(([field, value]) => {
            if (SETTINGS_FIELDS.includes(field)) {
                settingsFields[field] = value;
            } else {
                habitFields[field] = value;
            }
        });

        let allSuccess = true;

        try {
            if (Object.keys(habitFields).length > 0) {
                const res = await api.post(`${API_URL}updatehabit`, {
                    habit_id: habitId,
                    table: "habits",
                    ...habitFields
                });
                if (!res.data.success) allSuccess = false;
            }

            if (Object.keys(settingsFields).length > 0) {
                const res = await api.post(`${API_URL}updatehabit`, {
                    habit_id: habitId,
                    table: "habits_settings",
                    ...settingsFields
                });
                if (!res.data.success) allSuccess = false;
            }

            if (allSuccess) {
                setLocalChanges(prev => {
                    const updated = { ...prev };
                    delete updated[habitId];
                    return updated;
                });

                refetchHabits();
                loadHabit(String(habitId));
            } else {
                showNotification("error", "Не удалось сохранить все изменения");
            }
        } catch (err) {
            console.error("❌ Ошибка при сохранении привычки:", err);
            showNotification("error", "Ошибка при сохранении привычки");
        } finally {
            setIsUpdating(prev => prev.filter(item => item !== `habit_${habitId}`));
        }
    }, [localChanges, API_URL, refetchHabits, loadHabit, showNotification]);

    return (
        <UpdateHabitContext.Provider
            value={{
                setNewName,
                setNewDescription,
                setNewOngoing,
                setNewPeriodicity,
                setNewDays,
                setNewStartTime,
                setNewEndTime,
                setPin,
                setNewTag,
                isUpdating,
                localChanges,
                setNewMetricType,
                setNewScheduleBool,
                saveHabit,
                setNewAutoScheduleCompletion
            }}
        >
            {children}
        </UpdateHabitContext.Provider>
    );
};

export default UpdateHabitContext;