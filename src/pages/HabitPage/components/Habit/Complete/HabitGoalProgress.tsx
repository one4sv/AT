import { useTranslation } from "react-i18next";
import { useHabitGoals } from "../../../../../components/hooks/useHabitGoals";
import { useHabitGoalDisplay } from "../../../../../components/hooks/useHabitGoalDisplay";
import { useSideMenu } from "../../../../../components/hooks/SideMenuHook";
import "../../Overview/goalLocale";
import "../../../scss/goalWorkspace.scss";

export default function HabitGoalProgress({habitId,isMy}: {habitId:number;isMy:boolean}) {
    const {t}=useTranslation("goals");
    const {selected}=useHabitGoalDisplay(habitId,isMy);
    const {linked}=useHabitGoals(habitId,isMy && !!selected);
    const {setShowSlide,setShowHabitMenu}=useSideMenu();
    const goal=linked.find(g=>String(g.id)===selected && (g.status==="active" || g.status==="paused"));
    if(!isMy || !goal) return null;
    return <button type="button" className="habitSelectedGoal" onClick={()=>{
        setShowSlide("goals");
        setShowHabitMenu(true);
    }}>
        <span className="habitSelectedGoalLabel"><span>{goal.name}</span><small>{goal.progress}%</small></span>
        <span className="goalOverviewProgress" role="progressbar" aria-label={t("progress")} aria-valuemin={0}
            aria-valuemax={100} aria-valuenow={goal.progress}><span style={{width:goal.progress+"%"}}/></span>
    </button>;
}
