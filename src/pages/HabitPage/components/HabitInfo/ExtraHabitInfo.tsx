import { ChevronDown } from "lucide-react";
import "../../scss/extraHabitInfo.scss"
import { useState } from "react";
import { Square } from "@phosphor-icons/react";
import type { Habit } from "../../../../components/context/HabitsContext";

export default function ExtraHabitInfo({habit, readOnly}:{habit:Habit, readOnly:boolean}) {
    const [ isShown, setIsShown ] = useState(false)

    if (habit && readOnly) return null

    return (        
        <div className="extraHabitInfoDiv">
            <div className="extraHabitInfoShower" onClick={()=>setIsShown(!isShown)}>
                Дополнительно <ChevronDown />
            </div>
            <div className="extraHabitInfoSettings">
                <div className="extraHabitInfoStr">
                    <div className="addHabbitCheckBox redHabitCheckbox">
                        <Square id="checkBoxAutoComp" className="notactive" />
                        <label htmlFor="checkBoxPresent">Автовыполнение</label>
                    </div>
                    <div className="addHabbitCheckBox redHabitCheckbox">
                        <Square id="checkBoxAutoComp" className="notactive" />
                        <label htmlFor="checkBoxPresent">Продолжительная привычка</label>
                    </div>
                    <div className="addHabbitCheckBox redHabitCheckbox">
                        <Square id="checkBoxAutoComp" className="notactive" />
                        <label htmlFor="checkBoxPresent">Расписание</label>
                    </div>
                </div>
            </div>
        </div>
    )
}