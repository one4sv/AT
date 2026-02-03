import { ChevronDown } from "lucide-react";
import "../../scss/extraHabitInfo.scss"
import { useState } from "react";
import Toggler from "../../../../components/ts/toggler";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import Checkbox from "../../../../components/ts/utils/Checkbox";

export default function HabitSettings({ readOnly }:{ readOnly:boolean }) {
    const { habitSettings, habit, habitTimer } = useTheHabit()
    const { setNewMetricType, setNewScheduleBool } = useUpHabit()
    const [ isShown, setIsShown ] = useState(true)

    const isMetricDisabled = readOnly || (habitTimer !== null && habitTimer.status !== "ended")

    const funcTimer = () => {
        if (habit && !isMetricDisabled)
        setNewMetricType(habit.id, "timer")
    }
    const funcCounter = () => {
        if (habit && !isMetricDisabled)
        setNewMetricType(habit.id, "counter")
    }
    const funcSchedule = (val:boolean) => {
        if (habit)
        setNewScheduleBool(habit.id, val)
    }
    if (!habit) return null

    return (        
        <div className="extraHabitInfoDiv">
            <div className="extraHabitInfoShower" onClick={()=>setIsShown(!isShown)}>
                Настройки <ChevronDown style={{transform: `rotate(${isShown ? "180deg" : "0"})`}}/>
            </div>
            <div className={`extraHabitInfoSettings ${isShown ? "shown" : ""}`}>
                <div className={`extraHabitInfo ${readOnly ? "readonly" : ""}`}>
                    <div className={`redHabitBlock ${isMetricDisabled ? "disabled" : ""}`}>
                        <span className="redHabitSpan">Тип измерения: <span className="techSpan">{isMetricDisabled ? " (запущен таймер)" : ""}</span></span>
                        <span className="redHabitSettingSpan" onClick={funcTimer}>
                            <Checkbox state={habitSettings.metric_type === "timer"} disable={isMetricDisabled}/> По времени
                        </span>
                        <span className="redHabitSettingSpan" onClick={funcCounter}>
                            <Checkbox state={habitSettings.metric_type === "counter"} disable={isMetricDisabled}/> По количеству
                        </span>
                    </div>
                    <div className="redHabitStr">
                        <span className="redHabitSpan">Расписание:</span>
                        <span className="redHabitToggler">
                            <Toggler state={habitSettings.schedule} disable={readOnly} funcToggle={() => funcSchedule(!habitSettings.schedule)}/>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}