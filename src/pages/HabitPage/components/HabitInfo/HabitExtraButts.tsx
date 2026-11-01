import "../../scss/Goals.scss";
import { CaretRightIcon, GearSix, NotebookIcon, Target, UsersIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { UserRoundPlus } from "lucide-react";
import { useNote } from "../../../../components/hooks/NoteHook";
import { useSideMenu } from "../../../../components/hooks/SideMenuHook";
import useHabitMembers from "./useHabitMembers";

export default function HabitExtraButts({ isMy }: { isMy: boolean }) {
    const { showDevNote } = useNote();
    const { habit } = useTheHabit();
    const { data } = useHabitMembers(habit?.id);
    const { setShowSlide } = useSideMenu();
    const isMember = isMy || data?.access.is_member;
    return <div className="habitPlusDiv"><div className="habitPlusButts">
        {isMember ? <div className="addGoalButtDiv" onClick={() => setShowSlide("chat")}>
            {data?.member_count || habit?.chat_id ? <UsersIcon className="addGoalIcon chats" weight="fill" /> : <UserRoundPlus className="addGoalIcon chats" />}
            {data?.member_count || habit?.chat_id ? "Настройки совместной активности" : "Пригласить в активность"}
            <CaretRightIcon className="addGoalCaret" />
        </div> : data?.owner && <Link className="addGoalButtDiv habitOwnerLink" to={`/acc/${data.owner.nick}`}>
            {data.owner.avatar_url ? <img src={data.owner.avatar_url} alt="" /> : <UserCircleIcon />}
            <span>{data.owner.username || data.owner.nick}<span className="habitSettingValue">Владелец{habit?.chat_id ? " + беседа" : data.member_count ? ` + ${data.member_count}` : ""}</span></span>
            <CaretRightIcon className="addGoalCaret" />
        </Link>}
        {isMy && <div className="addGoalButtDiv" onClick={() => setShowSlide("settings")}><GearSix weight="fill" className="addGoalIcon settings" />Настройки<CaretRightIcon className="addGoalCaret" /></div>}
        {isMy && <div className="addGoalButtDiv" onClick={() => showDevNote()}><Target weight="fill" className="addGoalIcon goal" />Добавить цель<CaretRightIcon className="addGoalCaret" /></div>}
        {isMember && <div className="addGoalButtDiv" onClick={() => setShowSlide("journal")}><NotebookIcon weight="fill" className="addGoalIcon" />Журнал активности<CaretRightIcon className="addGoalCaret" /></div>}
    </div></div>;
}
