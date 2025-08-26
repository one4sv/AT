import { useContext } from "react";
import NoteContext from "../context/NoteContext";
import type { NoteContextType } from "../context/NoteContext";

export const useNote = (): NoteContextType => {
    const context = useContext(NoteContext);
    if (!context) {
        throw new Error("useNote must be used within an NoteProvider");
    }
    return context;
};
