import { useMemo, useState, useEffect } from "react";
import { useTheHabit } from "../TheHabitHook";
import { useNote } from "../NoteHook";
import { timeToMinutes } from "../../ts/utils/dateToStr";
import type { ChecklistPattern } from "../../context/TheHabitContext";
import { api } from "../../ts/api";
import axios from "axios";

export function useChecklistPattern(habitId: number | undefined, chosenDay: string) {
    const { pattern: globalPattern, checklist, loadHabit } = useTheHabit();
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL;

    const [localBlocks, setLocalBlocks] = useState<ChecklistPattern[]>([]);

    // Что показывать пользователю
    const displayBlocks = useMemo(() => {
        const overrides = checklist.filter(b => 
            b.date === chosenDay && b.habit_id === habitId
        );

        if (overrides.length > 0) {
            return overrides.sort((a, b) => 
                timeToMinutes(a.start_time || "") - timeToMinutes(b.start_time || "")
            );
        }

        return [...globalPattern].sort((a, b) => 
            timeToMinutes(a.start_time || "") - timeToMinutes(b.start_time || "")
        );
    }, [globalPattern, checklist, chosenDay, habitId]);

    const isOverridden = useMemo(() => 
        checklist.some(b => b.date === chosenDay && b.habit_id === habitId),
    [checklist, chosenDay, habitId]);

    // Локальное редактирование
    useEffect(() => {
        setLocalBlocks(displayBlocks);
    }, [displayBlocks]);

    const updateBlock = (id: number, field: keyof ChecklistPattern, value: string) => {
        setLocalBlocks(prev => 
            prev.map(b => b.id === id ? { ...b, [field]: value } : b)
        );
    };

    const addBlock = () => {
        const newBlock: ChecklistPattern = {
            id: Date.now() + Math.random(),
            start_time: "",
            end_time: "",
            name: "",
            habit_id: habitId!,
        };
        setLocalBlocks(prev => [...prev, newBlock]);
    };

    const saveGlobalPattern = async () => {
        if (!habitId) return;

        try {
            await api.post(`${API_URL}checklist/pattern/save`, {
                habit_id: habitId,
                items: localBlocks
            });
            await loadHabit(String(habitId));
            showNotification("success", "Шаблон успешно сохранён");
        } catch (e) {
            showNotification("error", axios.isAxiosError(e) && e.response?.data.error);
        }
    };

    const overrideToday = async () => {
        if (!habitId) return;
        try {
            await api.post(`${API_URL}checklist/override`, {
                habit_id: habitId,
                date: chosenDay,
                items: globalPattern
            });
            await loadHabit(String(habitId));
            showNotification("success", "Создано изменение на этот день");
        } catch (e) {
            showNotification("error", axios.isAxiosError(e) && e.response?.data.error);
        }
    };

    const removeOverride = async () => {
        if (!habitId) return;
        try {
            await api.post(`${API_URL}checklist/override/remove`, {
                habit_id: habitId,
                date: chosenDay
            });
            await loadHabit(String(habitId));
            showNotification("success", "Изменения на день удалены");
        } catch (e) {
            showNotification("error", axios.isAxiosError(e) && e.response?.data.error);
        }
    };

    return {
        displayBlocks,
        localBlocks,
        setLocalBlocks,
        isOverridden,
        updateBlock,
        addBlock,
        saveGlobalPattern,
        overrideToday,
        removeOverride,
        globalPattern,
    };
}