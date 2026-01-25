import type { Habit } from "../context/HabitsContext"
import { useNavigate } from "react-router"
import { CheckCircle, PushPinIcon  } from "@phosphor-icons/react"
import { habitIcon } from "./habitIcon"
import { useContextMenu } from "../hooks/ContextMenuHook"

export default function HabitDiv({habit, id, isMyAcc, is_archieve}:{habit:Habit, id?:number, isMyAcc?:boolean, is_archieve?:boolean}) {
    const { openMenu } = useContextMenu()
    const navigate = useNavigate()
    
    const todayNum = new Date().getDay()
    const ruPeriodicity = (habit: Habit) => {
        const { periodicity: per, start_time: st, end_time: et, chosen_days } = habit;
        if (habit.is_archieve) return "в архиве"

        const formatTime = () => {
            if (st && et && st !== null) {
                return ` с ${st} до ${et}`;
            }
            if (st || et) {
                return st ? ` в ${st}` : ` до ${et}`
            }
            return "";
        };
        if (per === "everyday") return `Каждый день${formatTime()}`;
        if (per === "sometimes") return `Иногда${formatTime()}`;
        if (per === "weekly" && chosen_days && chosen_days.length > 0) {
            let nearestDiff = 7;
            for (const day of chosen_days) {
                const diff = (day - todayNum + 7) % 7;
                if (diff < nearestDiff) {
                    nearestDiff = diff;
                }
            }

            let dayLabel = ""
            const isInDateRange = habit.end_date ? new Date(habit.end_date) > new Date() : true
            if (nearestDiff === 0 && isInDateRange) {
                dayLabel = "Сегодня";
            } else if (nearestDiff === 1 && isInDateRange) {
                dayLabel = "Завтра";
            } else if (isInDateRange) {
                const date = new Date();
                date.setDate(date.getDate() + nearestDiff);
                dayLabel = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
            }

            return `${dayLabel}${formatTime()}`;
        }

        return formatTime();
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
                    {!is_archieve && ruPeriodicity(habit)}
                    {habit.done && <CheckCircle className="habitHLStatus" weight="fill"/>}
                </div>
                {habit.pinned && isMyAcc && <PushPinIcon className="pinnedHabitSign" weight="fill"/>}
            </div>
        </div>
    )
}