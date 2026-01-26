import "../../../scss/SM/habitsList.scss";
import { useHabits } from "../../hooks/HabitsHook";
import { useSettings } from "../../hooks/SettingsHook";
import HabitDiv from "../Habit";
import { useChat } from "../../hooks/ChatHook";
import { useParams } from "react-router";
import { filterHabitsByOrder } from "../utils/filteredHabitsByOrder";

export default function HabitsList({filter}: {filter?: string}) {
    const { search } = useChat();
    const { habits, newOrderHabits } = useHabits();
    const { showArchived } = useSettings();
    const { habitId } = useParams();

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
                            const filtered = filterHabitsByOrder(order, sectionHabits, search);
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