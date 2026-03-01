import "../../../scss/SM/habitsList.scss";
import { useHabits } from "../../hooks/HabitsHook";
import { useSettings } from "../../hooks/SettingsHook";
import HabitDiv from "../Habit";
import { useChat } from "../../hooks/ChatHook";
import { useParams } from "react-router";
import { filterHabitsByOrder } from "../utils/filteredHabitsByOrder";
import { useEffect, useState } from "react";
import type { Habit } from "../../context/HabitsContext";
import { isIsoDate } from "../utils/isIsoDate";

export default function HabitsList({ filter }: { filter?: string }) {
    const { search } = useChat();
    const { habits, newOrderHabits } = useHabits();
    const { showArchived } = useSettings();
    const { habitId } = useParams();
    const [filtered, setFiltered] = useState(habits);
    const shownHabits = new Set<number>();
    console.log(filter);

    const getTargetDate = (f: string | undefined): Date | null => {
        if (!f) return null;
        if (f === "today") {
            return new Date();
        } else if (f === "tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        } else if (isIsoDate(f)) {
            return new Date(f);
        }
        return null;
    };

    const isScheduledOnDate = (h: Habit, targetDate: Date): boolean => {
        if (h.end_date) {
            const endDate = new Date(h.end_date);
            if (targetDate > endDate) return false;
        }
        const targetDay = targetDate.getDay();
        if (h.periodicity === "weekly" && h.chosen_days && h.chosen_days.includes(targetDay)) {
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (!habits) return;

        let filteredHabits = habits;

        // Фильтр по архиву
        if (filter === "archived") {
            filteredHabits = habits.filter(h => h.is_archived);
        } else {
            if (!showArchived) {
                filteredHabits = filteredHabits.filter(h => !h.is_archived);
            }

            const targetDate = getTargetDate(filter);
            if (targetDate) {
                filteredHabits = filteredHabits.filter(h => isScheduledOnDate(h, targetDate));
            } else if (filter === "pinned") {
                filteredHabits = filteredHabits.filter(h => h.pinned);
            } else if (filter && filter !== "all") {
                filteredHabits = filteredHabits.filter(h => h.periodicity === filter);
            }
        }

        setFiltered(filteredHabits);
    }, [filter, showArchived, habits]);

    return (
        <div className="habitsList SMlist">
            {filtered && newOrderHabits?.map(order => {
                const filteredByOrder = filterHabitsByOrder(order, filtered, search);
                const unique = filteredByOrder.filter(h => !shownHabits.has(h.id));
                unique.forEach(h => shownHabits.add(h.id));
                if (unique.length === 0) return null;
                return (
                    <div className="orderWrapper" key={order}>
                        {unique.map(habit => (
                            <HabitDiv
                                habit={habit}
                                key={habit.id}
                                id={Number(habitId)}
                                isMyAcc={true}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}