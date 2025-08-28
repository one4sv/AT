import { useEffect, useState, createContext, useCallback, type ReactNode } from "react";
import axios from "axios";
import { useHabits } from "../hooks/HabitsHook";
import { useNote } from "../hooks/NoteHook";

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
  setNewTag: (habitId: number, val: string | null) => void;
  isUpdating: string[];
  localChanges: { [key: number]: Partial<Record<string, any>> };
};

type UpdateQueueItem = {
  habitId: number;
  field: string;
  value: string | number[] | boolean | Date | null;
};

const UpdateHabitContext = createContext<UpdateHabitContextType | null>(null);

export const UpdateHabitProvider = ({ children }: { children: ReactNode }) => {
  const { habits, refetchHabits } = useHabits();
  const { showNotification } = useNote();
  const [updateQueue, setUpdateQueue] = useState<UpdateQueueItem[]>([]);
  const [isUpdating, setIsUpdating] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localChanges, setLocalChanges] = useState<{ [key: number]: Partial<Record<string, any>> }>({});

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

  const enqueueUpdate = useCallback((habitId: number, field: string, value: any) => {
    setLocalChanges((prev) => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        [field]: value,
      },
    }));

    setUpdateQueue((prev) => [
      ...prev.filter((item) => !(item.field === field && item.habitId === habitId)),
      { habitId, field, value },
    ]);
    setIsUpdating((prev) => [...new Set([...prev, `habit_${habitId}`])]);
  }, []);

  const setNewName = useCallback((habitId: number, val: string) => enqueueUpdate(habitId, "name", val), [enqueueUpdate]);
  const setNewDescription = useCallback((habitId: number, val: string) => enqueueUpdate(habitId, "desc", val), [enqueueUpdate]);
  const setNewStartDate = useCallback((habitId: number, val: Date | null) => enqueueUpdate(habitId, "start_date", val), [enqueueUpdate]);
  const setNewEndDate = useCallback((habitId: number, val: Date | null) => enqueueUpdate(habitId, "end_date", val), [enqueueUpdate]);
  const setNewOngoing = useCallback((habitId: number, val: boolean) => enqueueUpdate(habitId, "ongoing", val), [enqueueUpdate]);
  const setNewPeriodicity = useCallback((habitId: number, val: string | number | null) => {
    if (typeof val === "string") enqueueUpdate(habitId, "periodicity", val);
  }, [enqueueUpdate]);
  const setNewDays = useCallback((habitId: number, days: { value: number; label: string; chosen: boolean }[] | null) => {
    const val = days?.filter(d => d.chosen).map(d => d.value) || [];
    enqueueUpdate(habitId, "chosen_days", val);
  }, [enqueueUpdate]);
  const setNewStartTime = useCallback((habitId: number, val: string | null) => enqueueUpdate(habitId, "start_time", val), [enqueueUpdate]);
  const setNewEndTime = useCallback((habitId: number, val: string | null) => enqueueUpdate(habitId, "end_time", val), [enqueueUpdate]);
  const setPin = useCallback((habitId: number, val: boolean) => enqueueUpdate(habitId, "pinned", val), [enqueueUpdate]);
  const setNewTag = useCallback((habitId: number, val: string | null) => enqueueUpdate(habitId, "tag", val), [enqueueUpdate]);

  const processQueue = useCallback(async () => {
    if (isProcessing || updateQueue.length === 0) return;
    setIsProcessing(true);

    const { habitId, field, value } = updateQueue[0];
    const selectedHabit = habits?.find((h) => h.id === habitId);

    if (
      (field === "name" && value === selectedHabit?.name) ||
      (field === "desc" && value === selectedHabit?.desc) ||
      (field === "start_date" && value instanceof Date && selectedHabit?.start_date && value.getTime() === new Date(selectedHabit.start_date).getTime()) ||
      (field === "start_date" && value === null && selectedHabit?.start_date === undefined) ||
      (field === "end_date" && ((value === null && selectedHabit?.end_date === undefined) ||
        (value instanceof Date && selectedHabit?.end_date && value.getTime() === new Date(selectedHabit.end_date).getTime()))) ||
      (field === "ongoing" && value === selectedHabit?.ongoing) ||
      (field === "periodicity" && value === selectedHabit?.periodicity) ||
      (field === "chosen_days" && JSON.stringify(value?.sort()) === JSON.stringify((selectedHabit?.chosen_days || []).sort())) ||
      (field === "start_time" && value === selectedHabit?.start_time) ||
      (field === "end_time" && value === selectedHabit?.end_time) ||
      (field === "pinned" && value === selectedHabit?.pinned) ||
      (field === "tag" && value === selectedHabit?.tag)
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
    };

    try {
      const res = await axios.post("http://localhost:3001/updatehabit", payload, {
        withCredentials: true,
      });
      if (res.data.success) {
        console.log("✅ Успешно обновлено:", field);
        showNotification("success", field === "pinned" ? "Закреплено" : "Обновлено");
        removeField(habitId, field);
        // Вызываем refetchHabits только если очередь пуста
        if (updateQueue.length === 1) {
          refetchHabits();
        }
      } else {
        throw new Error(res.data.error || "Ошибка при обновлении привычки");
      }
    } catch (err) {
      showNotification("error", "Ошибка при обновлении привычки");
      console.error("❌ Ошибка при обновлении привычки:", err);
      removeField(habitId, field);
      // Вызываем refetchHabits только если очередь пуста
      if (updateQueue.length === 1) {
        refetchHabits();
      }
    } finally {
      setUpdateQueue((prev) => prev.slice(1));
      setIsUpdating((prev) => prev.filter((item) => item !== `habit_${habitId}`));
      setIsProcessing(false);
    }
  }, [isProcessing, updateQueue, habits, showNotification, refetchHabits, removeField]);

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
      }}
    >
      {children}
    </UpdateHabitContext.Provider>
  );
};

export default UpdateHabitContext;