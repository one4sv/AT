import { useContext } from "react";
import ScheduleContext from "../context/ScheduleContext";

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error("useScheduleContext должен использоваться внутри ScheduleProvider");
    }
    return context;
};