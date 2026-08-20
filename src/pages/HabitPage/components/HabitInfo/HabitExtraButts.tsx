import type { SetStateAction } from "react";
import "../../scss/Goals.scss"
import { CaretRightIcon, GearSix, NotebookIcon, Target } from "@phosphor-icons/react";
import { UserRoundPlus } from "lucide-react";
import { useNote } from "../../../../components/hooks/NoteHook";
interface GoalsProps {
    id:number;
    setShowSettings: React.Dispatch<SetStateAction<boolean>>,
    setShowJurnal: React.Dispatch<SetStateAction<boolean>>,
    setShowChatMenu: React.Dispatch<SetStateAction<boolean>>,
}

export default function HabitExtraButts ({ setShowSettings, setShowJurnal, setShowChatMenu }:GoalsProps) {
    const { showDevNote } = useNote()

    return (
        <div className="habitPlusDiv">
            <div className="habitPlusButts">
                <div className="addGoalButtDiv" onClick={() => setShowChatMenu(true)}>
                    <UserRoundPlus className="addGoalIcon chats"/>
                    Добавить в чат
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                <div className="addGoalButtDiv" onClick={() => setShowSettings(true)}>
                    <GearSix weight="fill" className="addGoalIcon settings"/>
                    Настройки
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                <div className="addGoalButtDiv" onClick={() => showDevNote()}>
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