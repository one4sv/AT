import "../../scss/Goals.scss"
import { CaretRightIcon, GearSix, NotebookIcon, Target } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { UserRoundPlus } from "lucide-react";
import { useNote } from "../../../../components/hooks/NoteHook";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";

export default function HabitExtraButts ({ isMy }: { isMy: boolean }) {
    const { showDevNote } = useNote()
    const { habit } = useTheHabit()
    const [hasMembers, setHasMembers] = useState(false)
    useEffect(() => {
        if (!habit?.id) return;
        let active = true;
        const reload = () => api.get(`habits/${habit.id}/members`).then(res => {
            if (active) setHasMembers((res.data.members || []).some((member: { status: string }) => member.status === "accepted" || member.status === "pending"));
        }).catch(() => {});
        void reload();
        window.addEventListener("habit-members-updated", reload);
        return () => { active = false; window.removeEventListener("habit-members-updated", reload); };
    }, [habit?.id])
    const { setShowSlide } = useSideMenu() 
    return (
        <div className="habitPlusDiv">
            <div className="habitPlusButts">
                <div className="addGoalButtDiv" onClick={() => setShowSlide("chat")}>
                    <UserRoundPlus className="addGoalIcon chats"/>
                    {hasMembers ? "Настройки совместной активности" : "Пригласить в активность"}
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
                {isMy && <div className="addGoalButtDiv" onClick={() => setShowSlide("settings")}>
                    <GearSix weight="fill" className="addGoalIcon settings"/>
                    Настройки
                    <CaretRightIcon className="addGoalCaret"/>
                </div>}
                {isMy && <div className="addGoalButtDiv" onClick={() => showDevNote()}>
                    <Target weight="fill" className="addGoalIcon goal"/>
                    Добавить цель
                    <CaretRightIcon className="addGoalCaret"/>
                </div>}                
                <div className="addGoalButtDiv" onClick={() => setShowSlide("journal")}>
                    <NotebookIcon  weight="fill" className="addGoalIcon"/>
                    Журнал активности
                    <CaretRightIcon className="addGoalCaret"/>
                </div>
            </div>
        </div>
    )
}