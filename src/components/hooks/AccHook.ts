import { useContext } from "react";
import AccContext from "../context/AccContext.tsx";
import type { AccContextType } from "../context/AccContext.tsx";

export const useAcc = (): AccContextType => {
    const context = useContext(AccContext);
    if (!context) {
        throw new Error("useAcc must be used within an AccProvider");
    }
    return context;
};
