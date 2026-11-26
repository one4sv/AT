import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { parseSharedGoalLink } from "../../pages/Chat/utils/sharedGoal";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "./scss/goalWorkspace.scss";
import "../../pages/HabitPage/components/Overview/goalLocale";
export default function SharedGoalPreview(){
    const {t}=useTranslation("goals");
    const {t:common}=useTranslation("common");
    const {blackout,setBlackout}=useBlackout();
    const goal=parseSharedGoalLink(blackout.options?.url||"",window.location.origin);
    if(!goal)return null;
    return <ConfirmActionLayout title={goal.name} actions={<button type="button" onClick={()=>setBlackout({seted:false})}>{common("chatUi.quickCommands.close")}</button>}>
        <p>{common("chatUi.goalSnapshot")}</p>
        <div className="goalWorkspaceProgressHead"><span>{t("progress")}</span><span>{goal.progress}%</span></div>
        <div className="goalOverviewProgress goalDetailProgress" role="progressbar" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100}><span style={{width:goal.progress+"%"}}/></div>
        {goal.due&&<p>{goal.due}</p>}
        {goal.stages.length>0&&<div><h3>{t("stages")}</h3>{goal.stages.map((stage,index)=><p key={index}>{stage.done?"✓":"○"} {stage.title}</p>)}</div>}
    </ConfirmActionLayout>;
}
