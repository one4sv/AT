import { useContext } from "react";
import DoneContext, { type DoneContextType } from "../context/DoneContext.tsx";

export const useDone = (): DoneContextType => {
    const context = useContext(DoneContext);
    if (!context) {
        throw new Error("useDone must be used within an DoneProvider");
    }
    return context;
};
