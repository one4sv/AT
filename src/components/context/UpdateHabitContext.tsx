import { useState, createContext, useCallback, type ReactNode } from "react";
import { useHabits } from "../hooks/HabitsHook";
import { useNote } from "../hooks/NoteHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { api } from "../ts/api";

export type UpdateHabitContextType = {
    setNewName: (habitId: number, val: string) => void;
    setNewDescription: (habitId: number, val: string) => void;
    setNewStartDate: (habitId: number, val: Date | null) => void;
    setNewEndDate: (habitId: number, val: Date | null) => void;
    setNewOngoing: (habitId: number, val: boolean) => void;
    setNewPeriodicity: (habitId: number, val: string | number | null) => void;
    setNewDays: (habitId: number, val: { value: number; label: string; chosen: boolean }[] | null) => void;
    setNewStartTime: (habitId: number, val: string | null) => void;
    setNewEndTime: (habitId: number, val: string | null) => void;
    setPin: (habitId: number, val: boolean) => void;
    putInArchieve: (habitId: number, val: boolean) => void;
    setNewTag: (habitId: number, val: string | null) => void;
    setNewMetricType: (habitId: number, val: "timer" | "counter") => void;
    setNewScheduleBool: (habitId: number, val: boolean) => void;
    isUpdating: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    localChanges: { [key: number]: Partial<Record<string, unknown>> };
    saveHabit: (habitId: number) => Promise<void>;
};

const UpdateHabitContext = createContext<UpdateHabitContextType | null>(null);

export const UpdateHabitProvider = ({ children }: { children: ReactNode }) => {
    const { refetchHabits } = useHabits();
    const { loadHabit } = useTheHabit();           // ← убрали habit и habitSettings
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL;

    const [localChanges, setLocalChanges] = useState<{ [key: number]: Partial<Record<string, unknown>> }>({});
    const [isUpdating, setIsUpdating] = useState<string[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateLocalChanges = useCallback((habitId: number, field: string, value: unknown) => {
        if (field === "name" && (!value || (typeof value === "string" && value.trim() === ""))) return;
        if (field === "start_date" && !value) return;

        setLocalChanges(prev => ({
            ...prev,
            [habitId]: {
                ...prev[habitId],
                [field]: value,
            }
        }));
    }, []);

    const setNewName = useCallback((habitId: number, val: string) => updateLocalChanges(habitId, "name", val), [updateLocalChanges]);
    const setNewDescription = useCallback((habitId: number, val: string) => updateLocalChanges(habitId, "desc", val), [updateLocalChanges]);
    const setNewStartDate = useCallback((habitId: number, val: Date | null) => updateLocalChanges(habitId, "start_date", val), [updateLocalChanges]);
    const setNewEndDate = useCallback((habitId: number, val: Date | null) => updateLocalChanges(habitId, "end_date", val), [updateLocalChanges]);
    const setNewOngoing = useCallback((habitId: number, val: boolean) => updateLocalChanges(habitId, "ongoing", val), [updateLocalChanges]);
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
    const putInArchieve = useCallback((habitId: number, val: boolean) => updateLocalChanges(habitId, "is_archived", val), [updateLocalChanges]);
    const setNewTag = useCallback((habitId: number, val: string | null) => updateLocalChanges(habitId, "tag", val), [updateLocalChanges]);

    const setNewMetricType = useCallback((habitId: number, val: "timer" | "counter") => updateLocalChanges(habitId, "metric_type", val), [updateLocalChanges]);
    const setNewScheduleBool = useCallback((habitId: number, val: boolean) => updateLocalChanges(habitId, "schedule", val), [updateLocalChanges]);

    const saveHabit = useCallback(async (habitId: number) => {
        const changes = localChanges[habitId];
        if (!changes || Object.keys(changes).length === 0) return;

        setIsUpdating(prev => [...new Set([...prev, `habit_${habitId}`])]);

        const habitFields: Record<string, unknown> = {};
        const settingsFields: Record<string, unknown> = {};

        Object.entries(changes).forEach(([field, value]) => {
            if (field === "metric_type" || field === "schedule") {
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
                setNewStartDate,
                setNewEndDate,
                setNewOngoing,
                setNewPeriodicity,
                setNewDays,
                setNewStartTime,
                setNewEndTime,
                setPin,
                setNewTag,
                isUpdating,
                localChanges,
                putInArchieve,
                setNewMetricType,
                setNewScheduleBool,
                saveHabit
            }}
        >
            {children}
        </UpdateHabitContext.Provider>
    );
};

export default UpdateHabitContext;