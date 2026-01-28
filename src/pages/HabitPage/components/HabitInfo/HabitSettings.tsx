import { ChevronDown } from "lucide-react";
import "../../scss/extraHabitInfo.scss"
import { useState } from "react";
import Toggler from "../../../../components/ts/toggler";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";

export default function HabitSettings({ readOnly }:{ readOnly:boolean }) {
    const { habitSettings, habit } = useTheHabit()
    const { setNewTimer, setNewScheduleBool } = useUpHabit()
    const [ isShown, setIsShown ] = useState(true)
    const funcTimer = (val:boolean) => {
        if (habit)
        setNewTimer(habit.id, val)
    }
    const funcSchedule = (val:boolean) => {
        if (habit)
        setNewScheduleBool(habit.id, val)
    }
    if (!habit) return null

    return (        
        <div className="extraHabitInfoDiv">
            <div className="extraHabitInfoShower" onClick={()=>setIsShown(!isShown)}>
                Дополнительно <ChevronDown style={{transform: `rotate(${isShown ? "180deg" : "0"})`}}/>
            </div>
            <div className={`extraHabitInfoSettings ${isShown ? "shown" : ""}`}>
                <div className={`extraHabitInfo ${readOnly ? "readonly" : ""}`}>
                    <div className="redHabitStr">
                        <span className="redHabitSpan">Таймер</span>
                        <span className="redHabitToggler">
                            <Toggler state={habitSettings.timer} disable={!habit.end_time.length || readOnly} funcToggle={() => funcTimer(!habitSettings.timer)}/>
                        </span>
                    </div>
                    <div className="redHabitStr">
                        <span className="redHabitSpan">Расписание</span>
                        <span className="redHabitToggler">
                            <Toggler state={habitSettings.schedule} disable={readOnly} funcToggle={() => funcSchedule(!habitSettings.schedule)}/>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}