import { useContext } from "react";
import PlannedContext from "../context/PlannedContext.tsx";
import type { PlannedContextType } from "../context/PlannedContext.tsx";

export const usePlanned = (): PlannedContextType => {
    const context = useContext(PlannedContext);
    if (!context) {
        throw new Error("usePlanned must be used within an PlannedProvider");
    }
    return context;
};
