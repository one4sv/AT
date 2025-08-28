import { useContext } from "react";
import type { UpdateUserContextType } from "../context/UpdateUserContext";
import UpdateUserContext from "../context/UpdateUserContext";

export const useUpUser = (): UpdateUserContextType => {
    const context = useContext(UpdateUserContext);
    if (!context) {
        throw new Error("useUpUser must be used within an UpdateUserProvider");
    }
    return context;
};
