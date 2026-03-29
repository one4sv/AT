import { useContext } from "react";
import type { DiagramsContextType } from "../context/DiagramsContext";
import DiagramsContext from "../context/DiagramsContext";

export const useDiagrams = (): DiagramsContextType => {
    const context = useContext(DiagramsContext);
    if (!context) {
        throw new Error("useDiagrams must be used within an DiagramsProvider");
    }
    return context;
};
