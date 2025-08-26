import { useContext } from "react";
import UpdateHabitContext from "../context/UpdateHabitContext";
import type { UpdateHabitContextType } from "../context/UpdateHabitContext";

export const useUpHabit = (): UpdateHabitContextType => {
    const context = useContext(UpdateHabitContext);
    if (!context) {
        throw new Error("useUpdateHabit must be used within an UpdateHabitProvider");
    }
    return context;
};
