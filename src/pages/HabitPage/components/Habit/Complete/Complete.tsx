import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import Counter from "./Counter";
import DoneButton from "./DoneButt";
import Timer from "./Timer";
import "../../../scss/Complete.scss"
import ScheduleCompletion from "./ScheduleCompletion";
import ChosenDayDate from "../../../utils/ChosenDayDate";
import DoneCompletion from "./DoneCompletion";

export default function Complete({isMy} : {isMy:boolean}) {
    const { habit, habitSettings } = useTheHabit()
    if (!habit) return

    return (
        <div className="completeDiv">
            <ChosenDayDate/>
            <div className="completeMain">
                {habitSettings.metric_type === "timer" && <Timer isMy={isMy}/>}
                {habitSettings.metric_type === "counter" && <Counter isMy={isMy}/>}
                {habitSettings.metric_type === "schedule" && <ScheduleCompletion isMy={isMy}/>}
                {habitSettings.metric_type === "done" && <DoneCompletion isMy={isMy}/>}
            </div>
            {isMy && <DoneButton habitId={habit.id}/>}
        </div>
    )
}