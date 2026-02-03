import { useEffect, useState, createContext, useCallback, type ReactNode, useRef } from "react";
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
  localChanges: { [key: number]: Partial<Record<string, any>> };
};

type UpdateQueueItem = {
  habitId: number,
  field: string,
  value: string | number[] | boolean | Date | null,
  table: string
};

const UpdateHabitContext = createContext<UpdateHabitContextType | null>(null);

export const UpdateHabitProvider = ({ children }: { children: ReactNode }) => {
  const { refetchHabits } = useHabits();
  const { habitSettings, habit, loadHabit } = useTheHabit();
  const { showNotification } = useNote();
  const API_URL = import.meta.env.VITE_API_URL;

  const [updateQueue, setUpdateQueue] = useState<UpdateQueueItem[]>([]);
  const [isUpdating, setIsUpdating] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localChanges, setLocalChanges] = useState<{ [key: number]: Partial<Record<string, any>> }>({});
  const debounceRef = useRef<number | null>(null)

  const removeField = useCallback((habitId: number, field: string) => {
    setLocalChanges((prev) => {
      const updated = { ...prev };
      if (updated[habitId]) {
        const hchanges = { ...updated[habitId] };
        delete hchanges[field];
        if (Object.keys(hchanges).length === 0) {
          delete updated[habitId];
        } else {
          updated[habitId] = hchanges;
        }
      }
      return updated;
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enqueueUpdate = useCallback((habitId: number, field: string, value: any, table: string) => {
    if (field === "name" && (!value || value.trim() === "")) return;
    if (field === "start_date" && !value) return;

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setLocalChanges(prev => ({
        ...prev,
        [habitId]: {
          ...prev[habitId],
          [field]: value,
        }
      }));

      setUpdateQueue(prev => [
        ...prev.filter(item => !(item.field === field && item.habitId === habitId)),
        { habitId, field, value, table },
      ]);
      setIsUpdating(prev => [...new Set([...prev, `habit_${habitId}`])]);
    }, 300);
  }, []);

  const setNewName = useCallback((habitId: number, val: string) => enqueueUpdate(habitId, "name", val, "habits"), [enqueueUpdate]);
  const setNewDescription = useCallback((habitId: number, val: string) => enqueueUpdate(habitId, "desc", val, "habits"), [enqueueUpdate]);
  const setNewStartDate = useCallback((habitId: number, val: Date | null) => enqueueUpdate(habitId, "start_date", val, "habits"), [enqueueUpdate]);
  const setNewEndDate = useCallback((habitId: number, val: Date | null) => enqueueUpdate(habitId, "end_date", val, "habits"), [enqueueUpdate]);
  const setNewOngoing = useCallback((habitId: number, val: boolean) => enqueueUpdate(habitId, "ongoing", val, "habits"), [enqueueUpdate]);
  const setNewPeriodicity = useCallback((habitId: number, val: string | number | null) => {
    if (typeof val === "string") enqueueUpdate(habitId, "periodicity", val, "habits");
  }, [enqueueUpdate]);
  const setNewDays = useCallback((habitId: number, days: { value: number; label: string; chosen: boolean }[] | null) => {
    const val = days?.filter(d => d.chosen).map(d => d.value) || [];
    enqueueUpdate(habitId, "chosen_days", val, "habits");
  }, [enqueueUpdate]);
  const setNewStartTime = useCallback((habitId: number, val: string | null) => enqueueUpdate(habitId, "start_time", val, "habits"), [enqueueUpdate]);
  const setNewEndTime = useCallback((habitId: number, val: string | null) => enqueueUpdate(habitId, "end_time", val, "habits"), [enqueueUpdate]);
  const setPin = useCallback((habitId: number, val: boolean) => enqueueUpdate(habitId, "pinned", val, "habits"), [enqueueUpdate]);
  const putInArchieve = useCallback((habitId: number, val: boolean) => enqueueUpdate(habitId, "is_archived", val, "habits"), [enqueueUpdate]);
  const setNewTag = useCallback((habitId: number, val: string | null) => enqueueUpdate(habitId, "tag", val, "habits"), [enqueueUpdate]);

  // settings
  const setNewMetricType = useCallback((habitId: number, val: "timer" | "counter") => enqueueUpdate(habitId, "metric_type", val, "habits_settings"), [enqueueUpdate]);
  const setNewScheduleBool = useCallback((habitId: number, val: boolean) => enqueueUpdate(habitId, "schedule", val, "habits_settings"), [enqueueUpdate]);

  const processQueue = useCallback(async () => {
    if (isProcessing || updateQueue.length === 0) return;
    setIsProcessing(true);

    const { habitId, field, value, table } = updateQueue[0];

    if (
      (field === "name" && value === habit?.name) ||
      (field === "desc" && value === habit?.desc) ||
      (field === "start_date" && ((value == null && habit?.start_date == null) ||
        (value instanceof Date && habit?.start_date && value.getTime() === new Date(habit.start_date).getTime()))) ||
      (field === "end_date" && ((value == null && habit?.end_date == null) ||
        (value instanceof Date && habit?.end_date && value.getTime() === new Date(habit.end_date).getTime()))) ||
      (field === "ongoing" && value === habit?.ongoing) ||
      (field === "periodicity" && value === habit?.periodicity) ||
      (field === "chosen_days" && Array.isArray(value) && JSON.stringify(value?.sort()) === JSON.stringify((habit?.chosen_days || []).sort())) ||
      (field === "start_time" && value === habit?.start_time) ||
      (field === "end_time" && value === habit?.end_time) ||
      (field === "pinned" && value === habit?.pinned) ||
      (field === "tag" && value === habit?.tag) ||
      (field === "metric_type" && value === habitSettings.metric_type) ||
      (field === "schedule" && value === habitSettings.schedule)
    ) {
      removeField(habitId, field);
      setUpdateQueue((prev) => prev.slice(1));
      setIsUpdating((prev) => prev.filter((item) => item !== `habit_${habitId}`));
      setIsProcessing(false);
      return;
    }

    const payload = {
      habit_id: habitId,
      [field]: value instanceof Date ? value.toISOString() : value,
      table,
    };

    try {
      const res = await api.post(`${API_URL}updatehabit`, payload)
      if (res.data.success) {
        console.log("✅ Успешно обновлено:", field);
        removeField(habitId, field);
      if (updateQueue.length > 0) {
        refetchHabits();
        loadHabit(String(habitId))
      }
      } else {
        throw new Error(res.data.error || "Ошибка при обновлении привычки");
      }
    } catch (err) {
      showNotification("error", "Ошибка при обновлении привычки");
      console.error("❌ Ошибка при обновлении привычки:", err);
    } finally {
      setUpdateQueue((prev) => prev.slice(1));
      setIsUpdating((prev) => prev.filter((item) => item !== `habit_${habitId}`));
      setIsProcessing(false);
    }
  }, [isProcessing, updateQueue, habit, habitSettings, showNotification, removeField]);

  useEffect(() => {
    if (updateQueue.length === 0 || isProcessing) return;
    processQueue();
  }, [updateQueue, isProcessing, processQueue]);

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
        setNewScheduleBool
      }}
    >
      {children}
    </UpdateHabitContext.Provider>
  );
};

export default UpdateHabitContext;