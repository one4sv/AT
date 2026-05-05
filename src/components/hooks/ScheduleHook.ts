import { useContext } from "react";
import ScheduleContext, { type ScheduleContextType } from "../context/ScheduleContext";

/**
 * Контекст расписаний привычек.
 * Предоставляет данные о расписании, настройках и завершённых блоках.
 */
export const useSchedule = ():ScheduleContextType => {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error("useScheduleContext должен использоваться внутри ScheduleProvider");
    }
    return context;
};