import { useContext } from "react";
import type { TheHabitContextType } from "../context/TheHabitContext";
import TheHabitContext from "../context/TheHabitContext";

export const useTheHabit = (): TheHabitContextType => {
    const context = useContext(TheHabitContext);
    if (!context) {
        throw new Error("useTheHabit must be used within an TheHabitProvider");
    }
    return context;
};
