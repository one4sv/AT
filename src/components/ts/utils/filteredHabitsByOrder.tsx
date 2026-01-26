import type { Habit } from "../../context/HabitsContext";

export const filterHabitsByOrder = (order: string, habits: Habit[], search: string) => {
    const todayNum = new Date().getDay()
    const tomorrowNum = todayNum !== 6 ? todayNum + 1 : 0
    if (!habits) return [];

    let filtered: Habit[] = [];

    if (order === "pinned") filtered = habits.filter(h => h.pinned);
    else if (order === "everyday") filtered = habits.filter(h => h.periodicity === "everyday" && !h.pinned);
    else if (order === "today") filtered = habits.filter(h => h.chosen_days?.includes(todayNum) && !h.pinned && h.periodicity !== "everyday");
    else if (order === "tomorrow") filtered = habits.filter(h => h.chosen_days?.includes(tomorrowNum) && !h.pinned && h.periodicity !== "everyday");
    else if (order === "sometimes") {
        filtered = habits.filter(h => {
            if (h.periodicity === "sometimes" && !h.pinned) return true;
            if (h.periodicity === "weekly" && (!h.chosen_days || h.chosen_days.length === 0) && !h.pinned) return true;
            return false;
        });
    }
    else {
        const date = new Date(order);
        if (isNaN(date.getTime())) return [];
        const dayNum = date.getDay();
        filtered = habits.filter(h => h.chosen_days?.includes(dayNum) && !h.pinned && h.periodicity !== "everyday");
    }

    if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(h => h.name.toLowerCase().includes(lowerSearch));
    }

    return filtered;
};