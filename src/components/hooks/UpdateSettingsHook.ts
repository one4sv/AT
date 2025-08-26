import { useContext } from "react";
import UpdateSettingsContext from "../context/UpdateSettingsContext";
import type { UpdateSettingsContextType } from "../context/UpdateSettingsContext";

export const useUpSettings = (): UpdateSettingsContextType => {
    const context = useContext(UpdateSettingsContext);
    if (!context) {
        throw new Error("useUpSettings must be used within an UpdateSettingsProvider");
    }
    return context;
};
