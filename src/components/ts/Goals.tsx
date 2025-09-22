import { Plus } from "lucide-react";
import type { Habit } from "../context/HabitsContext";
import "../../scss/Goals.scss"
interface GoalsProps {
    habit: Habit | undefined;
    readOnly:boolean;
    id:number;
}

export default function Goals ({habit, readOnly}:GoalsProps) {
    return (
        <div className="goalsDiv">
            {habit && !readOnly ? (
                    <div className="addGoalButtDiv">
                        <button className="addGoalButt">
                            <Plus />
                            Добавить цель
                        </button>
                    </div>
                ) : (
                    ""
                )
            }
        </div>
    )
}