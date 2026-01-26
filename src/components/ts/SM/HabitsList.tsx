import "../../../scss/SM/habitsList.scss";
import { useHabits } from "../../hooks/HabitsHook";
import { useSettings } from "../../hooks/SettingsHook";
import HabitDiv from "../Habit";
import { useChat } from "../../hooks/ChatHook";
import { useParams } from "react-router";
import { filterHabitsByOrder } from "../utils/filteredHabitsByOrder";
import { useEffect, useState } from "react";

export default function HabitsList({filter}: {filter?: string}) {
    const { search } = useChat();
    const { habits, newOrderHabits } = useHabits();
    const { showArchived } = useSettings();
    const { habitId } = useParams();
    const [ filtered, setFiltered ] = useState(habits);
    const shownHabits = new Set<number>();

    useEffect(() => {
        if (!habits) return;

        let filteredHabits = habits;

        if (!showArchived) filteredHabits = filteredHabits.filter(h => !h.is_archived);

        if (filter && filter !== "all" && filter !== "archived") {
            filteredHabits = filteredHabits.filter(h => h.periodicity === filter);
        } else if (filter === "archived") {
            filteredHabits = habits.filter(h => h.is_archived);
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