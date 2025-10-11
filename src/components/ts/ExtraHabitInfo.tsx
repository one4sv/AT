import { ChevronDown } from "lucide-react";
import "../../scss/extraHabitInfo.scss"
import { useState } from "react";
import { Square } from "@phosphor-icons/react";

export default function ExtraHabitInfo() {
    const [ isShown, setIsShown ] = useState(false)
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
                </div>
            </div>
        </div>
    )
}