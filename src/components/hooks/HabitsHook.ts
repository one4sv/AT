import { useContext } from "react";
import HabitsContext from "../context/HabitsContext";
import type { HabitContextType } from "../context/HabitsContext";

export const useHabits = (): HabitContextType => {
    const context = useContext(HabitsContext);
    if (!context) {
        throw new Error("useHabits must be used within an HabitsProvider");
    }
    return context;
};
