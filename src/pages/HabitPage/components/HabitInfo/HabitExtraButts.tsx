import type { SetStateAction } from "react";
import "../../scss/Goals.scss"
import { CaretRightIcon, GearSix, NotebookIcon, Target } from "@phosphor-icons/react";
import { UserRoundPlus } from "lucide-react";
interface GoalsProps {
    id:number;
    setShowSettings: React.Dispatch<SetStateAction<boolean>>,
    setShowJurnal: React.Dispatch<SetStateAction<boolean>>
}

export default function HabitExtraButts ({ setShowSettings, setShowJurnal}:GoalsProps) {
    return (
        <div className="habitPlusDiv">
            <div className="habitPlusButts">
                <div className="addGoalButtDiv">
                    <UserRoundPlus className="addGoalIcon chats"/>
                    Добавить людей
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