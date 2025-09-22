import { useContext } from "react";
import CalendarContext from "../context/CalendarContext";
import type { CalendarContextType } from "../context/CalendarContext";

export const useCalendar = (): CalendarContextType => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error("useCalendar must be used within an CalendarProvider");
    }
    return context;
};
