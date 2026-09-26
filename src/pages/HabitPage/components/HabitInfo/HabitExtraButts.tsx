import "../../scss/Goals.scss"
import { CaretRightIcon, GearSix, NotebookIcon, Target } from "@phosphor-icons/react";
import { UserRoundPlus } from "lucide-react";
import { useNote } from "../../../../components/hooks/NoteHook";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";

export default function HabitExtraButts () {
    const { showDevNote } = useNote()
    const { setShowSlide } = useSideMenu() 
    return (
        <div className="habitPlusDiv">
            <div className="habitPlusButts">
                <div className="addGoalButtDiv" onClick={() => setShowSlide("chat")}>
                    <UserRoundPlus className="addGoalIcon chats"/>
                    Добавить в чат
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                <div className="addGoalButtDiv" onClick={() => setShowSlide("settings")}>
                    <GearSix weight="fill" className="addGoalIcon settings"/>
                    Настройки
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                <div className="addGoalButtDiv" onClick={() => showDevNote()}>
                    <Target weight="fill" className="addGoalIcon goal"/>
                    Добавить цель
                    <CaretRightIcon className="addGoalCaret"/>
                </div>                
                <div className="addGoalButtDiv" onClick={() => setShowSlide("journal")}>
                    <NotebookIcon  weight="fill" className="addGoalIcon"/>
                    Журнал активности
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
            </div>
        </div>
    )
}