import { useContext } from "react";
import type { DeleteContextType } from "../context/DeleteContext";
import DeleteContext from "../context/DeleteContext";

export const useDelete = (): DeleteContextType => {
    const context = useContext(DeleteContext);
    if (!context) {
        throw new Error("useDelete must be used within an DeleteProvider");
    }
    return context;
};
