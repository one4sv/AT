import { useContext } from "react";
import BlackoutContext from "../context/BlackoutContext";
import type { BlackoutContextType } from "../context/BlackoutContext";

export const useBlackout = (): BlackoutContextType => {
    const context = useContext(BlackoutContext);
    if (!context) {
        throw new Error("useBlackout must be used within an BlackoutProvider");
    }
    return context;
};
