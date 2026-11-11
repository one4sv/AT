import { useContext } from "react";
import HabitPlanningContext from "../context/HabitPlanningContext.tsx";
import type { HabitPlanningContextType } from "../context/HabitPlanningContext.tsx";

export const useHabitPlanning = (): HabitPlanningContextType => {
    const context = useContext(HabitPlanningContext);
    if (!context) {
        throw new Error("useHabitPlanning must be used within an HabitPlanningProvider");
    }
    return context;
};
