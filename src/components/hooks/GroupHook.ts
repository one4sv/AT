import { useContext } from "react";
import GroupContext, { type GroupContextType } from "../context/GroupContext.tsx";

export const useGroup = (): GroupContextType => {
    const context = useContext(GroupContext);
    if (!context) {
        throw new Error("useGroup must be used within an GroupProvider");
    }
    return context;
};
