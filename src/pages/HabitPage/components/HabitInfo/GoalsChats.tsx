import { Plus } from "lucide-react";
import type { Habit } from "../../../../components/context/HabitsContext";
import "../../scss/Goals.scss"
interface GoalsProps {
    habit: Habit | undefined;
    readOnly:boolean;
    id:number;
}

export default function GoalsChats ({habit, readOnly}:GoalsProps) {
    if (!habit || readOnly) return null
    return (
        <div className="habitPlusDiv">
            <div className="habitPlusButts">
                <div className="addGoalButtDiv">
                    <Plus />
                    Добавить цель
                </div>
                <div className="addGoalButtDiv">
                    <Plus />
                    Добавить в чат
                </div>
            </div>
        </div>
    )
}