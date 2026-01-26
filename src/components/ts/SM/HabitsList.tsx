import "../../../scss/SM/habitsList.scss";
import { useHabits } from "../../hooks/HabitsHook";
import { useSettings } from "../../hooks/SettingsHook";
import type { Habit } from "../../context/HabitsContext";
import HabitDiv from "../Habit";
import { useChat } from "../../hooks/ChatHook";
import { useParams } from "react-router";

export default function HabitsList() {
    const { search } = useChat();
    const { habits, newOrderHabits } = useHabits();
    const { showArchived } = useSettings();
    const { habitId } = useParams();

    const todayNum = new Date().getDay();
    const tomorrowNum = todayNum !== 6 ? todayNum + 1 : 0;

    const filterHabitsByOrder = (order: string, habits: Habit[]) => {
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

    // Секции: сначала активные, потом (если разрешено) архивные
    const sections: ("ongoing" | "archive")[] = ["ongoing"];
    if (showArchived) {
        sections.push("archive");
    }

    return (
        <div className="habitsList SMlist">
            {sections.map(section => {
                const sectionHabits = habits?.filter(h =>
                    section === "ongoing" ? h.ongoing : !h.ongoing
                ) || [];

                if (sectionHabits.length === 0) return null;

                const shownHabits = new Set<number>();

                return (
                    <div className="habitsWrapperStats" key={section}>
                        {newOrderHabits?.map(order => {
                            const filtered = filterHabitsByOrder(order, sectionHabits);
                            const unique = filtered.filter(h => !shownHabits.has(h.id));
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
            })}
        </div>
    );
}