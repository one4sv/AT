import { useContext } from "react";
import DropContext, { type DropContextType } from "../context/DropContext.tsx";

export const useDrop = (): DropContextType => {
    const context = useContext(DropContext);
    if (!context) {
        throw new Error("useDrop must be used within an DropProvider");
    }
    return context;
};
