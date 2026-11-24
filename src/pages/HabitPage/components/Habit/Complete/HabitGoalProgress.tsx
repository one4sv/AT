import { useTranslation } from "react-i18next";
import { useHabitGoals } from "../../../../../components/hooks/useHabitGoals";
import { useHabitGoalDisplay } from "../../../../../components/hooks/useHabitGoalDisplay";
import { useSideMenu } from "../../../../../components/hooks/SideMenuHook";
import { useSettings } from "../../../../../components/hooks/SettingsHook";
import { useHabits } from "../../../../../components/hooks/HabitsHook";
import { goalMetricCompatible,goalHabitMetricType,goalIsCurrent } from "../../Overview/goalTypes";
import "../../Overview/goalLocale";
import "../../../scss/goalWorkspace.scss";

export default function HabitGoalProgress({habitId,isMy}: {habitId:number;isMy:boolean}) {
    const {t}=useTranslation("goals");
    const {showHabitGoals}=useSettings();
    const {selected}=useHabitGoalDisplay(habitId,isMy && showHabitGoals);
    const {linked}=useHabitGoals(habitId,isMy && showHabitGoals && !!selected);
    const {setShowSlide,setShowHabitMenu}=useSideMenu();
    const {habits}=useHabits();
    const metricType=goalHabitMetricType(habits?.find(h=>String(h.id)===String(habitId)));
    const goal=linked.find(g=>String(g.id)===selected && goalMetricCompatible(g.progress_mode,metricType) && goalIsCurrent(g));
    if(!isMy || !showHabitGoals || !goal || (metricType!=="timer" && metricType!=="counter")) return null;
    return <button type="button" className="habitSelectedGoal" onClick={()=>{
        setShowSlide("goals");
        setShowHabitMenu(true);
    }}>
        <span className="habitSelectedGoalLabel"><span>{goal.name} · {t("progress")}</span><small>{goal.progress}%</small></span>
        <span className="goalOverviewProgress" role="progressbar" aria-label={t("progress")} aria-valuemin={0}
            aria-valuemax={100} aria-valuenow={goal.progress}><span style={{width:goal.progress+"%"}}/></span>
        {goal.today_progress!=null && <>
            <span className="habitSelectedGoalLabel"><span>{t("todayProgress")}</span><small>{goal.today_progress}%</small></span>
            <span className="goalOverviewProgress" role="progressbar" aria-label={t("todayProgress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={goal.today_progress}><span style={{width:goal.today_progress+"%"}}/></span>
        </>}
    </button>;
}
