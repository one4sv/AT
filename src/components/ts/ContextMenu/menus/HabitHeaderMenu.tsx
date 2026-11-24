import ReportButton from "../buttons/ReportButton";
import { useTranslation } from "react-i18next";
import { GearSix, NotebookIcon, Target, UserCircleIcon, UsersIcon } from "@phosphor-icons/react";
import { UserRoundPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { useTheHabit } from "../../../hooks/TheHabitHook";
import { useSideMenu } from "../../../hooks/SideMenuHook";
import { useUser } from "../../../hooks/UserHook";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import useHabitMembers from "../../../../pages/HabitPage/components/HabitInfo/useHabitMembers";
import { useHabitGoals } from "../../../hooks/useHabitGoals";

export default function HabitHeaderMenu() {
    const { t } = useTranslation("common");
    const { habit } = useTheHabit();
    const { user } = useUser();
    const { closeMenu } = useContextMenu();
    const { setShowHabitMenu, setShowSlide } = useSideMenu();
    const { data } = useHabitMembers(habit?.id);
    const navigate = useNavigate();
    const {linked}=useHabitGoals(habit?.id,!!habit && (habit.user_id===user.id || !!data?.access.is_member));

    if (!habit || !habit.ongoing) return null;

    const isMy = habit.user_id === user.id;
    const isMember = isMy || !!data?.access.is_member;

    const openSlide = (slide: "chat" | "settings" | "journal" | "goals") => {
        closeMenu();
        setShowSlide(slide);
        setShowHabitMenu(true);
    };

    return (
        <>
            {isMember ? (
                <div className="ContextMenuButt" onClick={() => openSlide("chat")}>
                    {data?.member_count || habit.chat_id ?
                        <UsersIcon weight="fill"/> : <UserRoundPlus/>}
                    {data?.member_count || habit.chat_id ?
                        t("habitUi.collaboration") : t("habitUi.invite")}
                </div>
            ) : data?.owner && (
                <div className="ContextMenuButt" onClick={() => {
                    closeMenu();
                    navigate(`/acc/${data.owner.nick}`);
                }}>
                    <UserCircleIcon/>
                    {data.owner.username || data.owner.nick}
                </div>
            )}
            {isMy && <div className="ContextMenuButt" onClick={() => openSlide("settings")}>
                <GearSix weight="fill"/>
                {t("habitUi.settings")}
            </div>}
            {isMember && <div className="ContextMenuButt" onClick={() => openSlide("goals")}>
                <Target weight="fill"/>
                {t(linked.length ? "habitUi.goals" : "habitUi.addGoal")}
            </div>}
            <ReportButton targetType="activity" targetId={String(habit.id)} isMy={isMy}/>
            {isMember && <div className="ContextMenuButt" onClick={() => openSlide("journal")}>
                <NotebookIcon weight="fill"/>
                {t("habitUi.journal")}
            </div>}
        </>
    );
}
