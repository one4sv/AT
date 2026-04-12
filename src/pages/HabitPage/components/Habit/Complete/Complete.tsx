import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import Counter from "./Counter";
import DoneButton from "./DoneButt";
import Timer from "./Timer";
import "../../../scss/Complete.scss"
import ScheduleComplition from "./ScheduleComplition";

export default function Complete({isMy} : {isMy:boolean}) {
    const { habit, habitSettings } = useTheHabit()

    if (!habit) return

    return (
        <div className="completeDiv">
            <div className="completeMain">
                {habitSettings.metric_type === "timer" && <Timer/>}
                {habitSettings.metric_type === "counter" && <Counter/>}
                {habitSettings.metric_type === "schedule" && <ScheduleComplition/>}
            </div>
            {isMy && <DoneButton habitId={habit.id}/>}
        </div>
    )
}