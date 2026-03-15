import type { Habit } from "../context/HabitsContext"
import { useNavigate } from "react-router"
import { CheckCircle, PushPinIcon  } from "@phosphor-icons/react"
import { habitIcon } from "./habitIcon"
import { useContextMenu } from "../hooks/ContextMenuHook"
import { formatHabitTime, formatScheduleTime } from "./utils/formatHabitTime"
import { useSchedule } from "../hooks/ScheduleHook"
import { isOddWeek } from "../../pages/HabitPage/utils/isOddWeek"
import { useSettings } from "../hooks/SettingsHook"

export default function HabitDiv({habit, id, isMyAcc, is_archived}:{habit:Habit, id?:number, isMyAcc?:boolean, is_archived?:boolean}) {
    const { openMenu } = useContextMenu()
    const navigate = useNavigate()
    const { schedules } = useSchedule()
    const { weekStart } = useSettings()
    const ruPeriodicity = (habit: Habit) => {
        const { periodicity: per, chosen_days } = habit;
        if (habit.is_archived) return "в архиве";

        const habitIdKey = String(habit.id);
        const habitBlocks = schedules[habitIdKey] || [];

        const todayNum = new Date().getDay();

        let targetDayNum = todayNum;
        let dayLabel = "Сегодня";
        let nearestDiff = 7;

        if (per === "weekly" && chosen_days?.length) {
            for (const day of chosen_days) {
                const diff = (day - todayNum + 7) % 7;
                if (diff < nearestDiff) nearestDiff = diff;
            }

            targetDayNum = (todayNum + nearestDiff) % 7;

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + nearestDiff);

            const targetIsOdd = isOddWeek(weekStart, targetDate);

            const isInDateRange = habit.end_date ? new Date(habit.end_date) > new Date() : true;

            if (nearestDiff === 0 && isInDateRange) {
                dayLabel = "Сегодня";
            } else if (nearestDiff === 1 && isInDateRange) {
                dayLabel = "Завтра";
            } else if (isInDateRange) {
                dayLabel = targetDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
            } else {
                dayLabel = "";
            }

            const targetBlocks = habitBlocks.filter(block =>
                !block.isSeparator &&
                block.day_of_week === targetDayNum &&
                block.start_time?.trim() &&
                (block.isSeparator === !targetIsOdd)
            );

            let timePart = "";

            if (targetBlocks.length > 0) {
                const timeToMinutes = (t: string) => {
                    if (!t.trim()) return 9999;
                    const cleaned = t.trim().replace(".", ":");
                    const [h = "0", m = "0"] = cleaned.split(":");
                    return Number(h) * 60 + Number(m);
                };

                let minMin = 24 * 60;
                let maxMin = 0;

                targetBlocks.forEach(b => {
                    const s = timeToMinutes(b.start_time!);
                    const e = b.end_time ? timeToMinutes(b.end_time) : 24 * 60;
                    if (s < minMin) minMin = s;
                    if (e > maxMin) maxMin = e;
                });



                const earliest = formatScheduleTime(minMin);
                const latest = formatScheduleTime(maxMin);

                if (earliest && latest && earliest !== latest) {
                    timePart = ` с ${earliest} до ${latest}`;
                } else if (earliest) {
                    timePart = ` в ${earliest}`;
                } else if (latest) {
                    timePart = ` до ${latest}`;
                }
            }

            if (!timePart) {
                timePart = formatHabitTime(habit);
            }

            return `${dayLabel}${timePart}`.trim();
        }

        const timePart = formatHabitTime(habit);

        if (per === "everyday") return `Каждый день${timePart}`;
        if (per === "sometimes") return `Иногда${timePart}`;

        return timePart.trim() || "";
    };
    
    if (isMyAcc === undefined) isMyAcc = true
        
    return(
        <div className={`habit themeHabit-default ${id === habit.id ? "active" : ""}`} onClick={() => navigate(`/habit/${habit.id}`)} onContextMenu={(e) => {
            e.preventDefault()
            openMenu( e.clientX, e.clientY, "habit", {id:String(habit.id), name:habit.name, isMy:isMyAcc}, habit)
        }}>
            {habit.tag ? (
                <div className="habitIcon">
                    {habitIcon(habit)}
                </div>
            ):(
                <></>
            )}
            <div className="habitInfo">
                <div className="habitName">{habit.name}</div>
                <div className="habitPer">
                    {!is_archived && ruPeriodicity(habit)}
                    {habit.done && <CheckCircle className="habitHLStatus" weight="fill"/>}
                </div>
                {habit.pinned && isMyAcc && <PushPinIcon className="pinnedHabitSign" weight="fill"/>}
            </div>
        </div>
    )
}