import type { Habit } from "../../context/HabitsContext";
import i18n from "../../../i18n/i18n";

export const formatHabitTime = (habit:Habit) => {
    const { start_time:st, end_time:et } = habit
    if (st && et && st !== null) {
        return ` ${st} - ${et}`;
    }
    if (st || et) {
        return st ? ` ${i18n.t("habitPageUi.day.at", { ns: "common", time: st })}` : ` ${i18n.t("habitPageUi.day.until", { ns: "common", time: et })}`
    }
    return "";
};

export const formatScheduleTime = (minutes: number) => {
    if (minutes <= 0 || minutes >= 24 * 60) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};