import type { Habit } from "../context/HabitsContext"
import { useNavigate } from "react-router"
import { PushPinIcon  } from "@phosphor-icons/react"
import { tags } from "./tags"

export default function HabitDiv({habit, id, isMyAcc}:{habit:Habit, id?:number, isMyAcc?:boolean}) {
    const navigate = useNavigate()
    
    const todayNum = new Date().getDay()

    const ruPeriodicity = (habit: Habit) => {
        const { periodicity: per, start_time: sd, end_time: ed, chosen_days } = habit;

        const formatTime = () => {
            if (sd || ed) {
                return ed ? ` с ${sd} по ${ed}` : ` в ${sd}`;
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

            let dayLabel;
            if (nearestDiff === 0) {
                dayLabel = "Сегодня";
            } else if (nearestDiff === 1) {
                dayLabel = "Завтра";
            } else {
                const date = new Date();
                date.setDate(date.getDate() + nearestDiff);
                dayLabel = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
            }

            return `${dayLabel}${formatTime()}`;
        }

        return formatTime();
    };

    const habitIcon = () => {
        const selectedTag = tags.find(tag => tag.value === habit.tag)
        if (!selectedTag) return null
        const Icon = selectedTag.icon
        return <Icon size={24} />
    }
    
    if (isMyAcc === undefined) isMyAcc = true

    return(
        <div className={`habit themeHabit-default ${id === habit.id ? "active" : ""}`} onClick={() => navigate(`/stats/${habit.id}`)}>
            {habit.tag ? (
                <div className="habitIcon">
                    {habitIcon()}
                </div>
            ):(
                <></>
            )}
            <div className="habitInfo">
                <div className="habitName">{habit.name}</div>
                <div className="habitPer">{ruPeriodicity(habit)}</div>
                {habit.pinned && isMyAcc ? <PushPinIcon className="pinnedHabitSign" weight="fill"/> : ""}
            </div>
        </div>
    )
}