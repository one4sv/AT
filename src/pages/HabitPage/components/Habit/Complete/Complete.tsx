import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import Counter from "./Counter";
import DoneButton from "./DoneButt";
import Timer from "./Timer";
import "../../../scss/Complete.scss"

export default function Complete({isMy} : {isMy:boolean}) {
    const { habit, habitSettings } = useTheHabit()

    if (!habit) return

    return (
        <div className="completeDiv">
            {habitSettings.metric_type === "timer" && <Timer/>}
            {habitSettings.metric_type === "counter" && <Counter/>}
            {isMy && <DoneButton habitId={habit.id}/>}
        </div>
    )
}