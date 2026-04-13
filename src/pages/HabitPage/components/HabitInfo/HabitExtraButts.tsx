import type { SetStateAction } from "react";
import type { Habit } from "../../../../components/context/HabitsContext";
import "../../scss/Goals.scss"
import { CaretRightIcon, Chats, GearSix, NotebookIcon, Target } from "@phosphor-icons/react";
interface GoalsProps {
    habit: Habit | undefined;
    readOnly:boolean;
    id:number;
    setShowSettings: React.Dispatch<SetStateAction<boolean>>,
    setShowJurnal: React.Dispatch<SetStateAction<boolean>>
}

export default function HabitExtraButts ({habit, readOnly, setShowSettings, setShowJurnal}:GoalsProps) {
    if (!habit || readOnly) return null
    return (
        <div className="habitPlusDiv">
            <div className="habitPlusButts">
                <div className="addGoalButtDiv">
                    <Chats weight="fill" className="addGoalIcon chats"/>
                    Добавить в чат
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                <div className="addGoalButtDiv" onClick={() => setShowSettings(true)}>
                    <GearSix weight="fill" className="addGoalIcon settings"/>
                    Настройки
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                <div className="addGoalButtDiv">
                    <Target weight="fill" className="addGoalIcon goal"/>
                    Добавить цель
                    <CaretRightIcon className="addGoalCaret"/>
                </div>                
                <div className="addGoalButtDiv" onClick={() => setShowJurnal(true)}>
                    <NotebookIcon  weight="fill" className="addGoalIcon"/>
                    Журнал активности
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
            </div>
        </div>
    )
}