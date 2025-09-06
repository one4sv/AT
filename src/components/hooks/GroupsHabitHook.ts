import { useContext } from "react";
import GroupsHabitContext from "../context/GroupsHabitContext.tsx";
import type { GroupsHabitContextType } from "../context/GroupsHabitContext.tsx";

export const useGroups = (): GroupsHabitContextType => {
    const context = useContext(GroupsHabitContext);
    if (!context) {
        throw new Error("useGroups must be used within an GroupsProvider");
    }
    return context;
};
