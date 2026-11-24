import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, TargetIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { goalsChanged } from "../hooks/useGoalsWorkspace";
import { useHabitGoals, hasHabitGoalLink } from "../hooks/useHabitGoals";
import { useHabitGoalDisplay } from "../hooks/useHabitGoalDisplay";
import SelectList from "../ts/SelectList";
import { useNote } from "../hooks/NoteHook";
import { useHabits } from "../hooks/HabitsHook";
import { useUser } from "../hooks/UserHook";
import { isGoalHabitAvailable } from "../ts/utils/goalLinkAvailability";
import { api } from "../ts/api";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "../../pages/HabitPage/scss/goalWorkspace.scss";
import "./scss/goalWorkspace.scss";

const manualModes = ["manual","metric","milestones","combined"];

export default function GoalPicker({slideHabitId}: {slideHabitId?:number} = {}) {
    const {t}=useTranslation("goals");
    const {blackout,setBlackout}=useBlackout();
    const habitIdRef=useRef(Number(blackout.options?.habitId));
    if(blackout.module==="GoalPicker" && blackout.options?.habitId) habitIdRef.current=Number(blackout.options.habitId);
    const habitId=slideHabitId ?? habitIdRef.current;
    const {habits,loadingHabits}=useHabits();
    const {user}=useUser();
    const isOwner=habits?.some(h=>String(h.id)===String(habitId) && h.user_id===user.id);
    const eligible=habits?.some(h=>String(h.id)===String(habitId) && isGoalHabitAvailable(h,user.id));
    const {goals,linked,loading,error}=useHabitGoals(habitId,!!isOwner);
    const {selected,select}=useHabitGoalDisplay(habitId,!!isOwner);
    const metricType=habits?.find(h=>String(h.id)===String(habitId))?.habits_settings?.metric_type;
    const displayChoices=metricType==="timer" || metricType==="counter" ? linked.filter(goal=>goal.status==="active" || goal.status==="paused") : [];
    const [saving,setSaving]=useState(false);
    const {showNotification}=useNote();
    const available=goals.filter(goal=>!hasHabitGoalLink(goal,habitId) && (goal.status==="active" || goal.status==="paused"));
    const openDetails=(goal:Goal)=>setBlackout({seted:true,module:"GoalDetails",options:{id:String(goal.id)}});
    const choose=async(goalId:number)=>{
        if(!eligible || saving) return;
        setSaving(true);
        try{
            const response=await api.post("goal-workspace/"+goalId+"/links",{kind:"habit",id:habitId});
            if(!response.data?.success) throw new Error("Link failed");
            goalsChanged();
            showNotification("success",t("updated"));
        }catch{showNotification("error",t("saveError"));}
        finally{setSaving(false);}
    };
    return <div className={slideHabitId!==undefined ? "habitInnerSlide habitGoalSlide" : "addHabitDiv addPlanDiv goalWorkspaceModal goalPicker"}>
        {slideHabitId!==undefined ? <div className="habitInnerSlideTitle">{t("title")}</div> : <h2>{t(linked.length?"title":"selectGoal")}</h2>}
        {loading || loadingHabits ? <span>{t("loading")}</span> : error ? <span>{t("loadError")}</span> :
            !isOwner ? <span>{t("inactiveLink")}</span> : <>
                {!!displayChoices.length && <div className="goalWorkspaceField">
                    <label>{t("displayGoal")}</label>
                    <SelectList className="goalWorkspaceSelect" selected={displayChoices.some(g=>String(g.id)===selected)?selected:"none"}
                        arr={[{value:"none",label:t("hideDisplayGoal")},...displayChoices.map(g=>({value:String(g.id),label:g.name}))]}
                        onChange={value=>select(value==="none"?"":value)}/>
                </div>}
                {!!linked.length && <div className="goalCatalogList">{linked.map(goal=>
                    <div className="goalCatalogItem goalLinkedItem" key={goal.id}>
                        <button type="button" className="goalLinkedTitle" onClick={()=>openDetails(goal)}>
                            <TargetIcon size={20}/>
                            <span className="goalCatalogName">{goal.name}</span>
                            <span className="goalCatalogProgress">{goal.progress}%</span>
                        </button>
                        <button type="button" className="goalIconButton" aria-label={t("edit")}
                            onClick={()=>setBlackout({seted:true,module:"AddGoal",options:{id:String(goal.id)}})}>
                            <PencilSimpleIcon size={24}/>
                        </button>
                        <span className="goalOverviewProgress" role="progressbar" aria-valuemin={0} aria-valuemax={100}
                            aria-valuenow={goal.progress}><span style={{width:goal.progress+"%"}}/></span>
                        {manualModes.includes(goal.progress_mode) && goal.status==="active" &&
                            <button type="button" className="goalWorkspaceQuiet goalLinkedProgress"
                                onClick={()=>openDetails(goal)}>{t("recordProgress")}</button>}
                        {goal.today_progress!=null && <div className="goalWorkspaceField">
                            <div className="goalWorkspaceProgressHead"><span>{t("todayProgress")}</span><span>{goal.today_progress}%</span></div>
                            <span className="goalOverviewProgress"><span style={{width:goal.today_progress+"%"}}/></span>
                        </div>}
                        {!manualModes.includes(goal.progress_mode) && <small>{t("automaticProgress")}</small>}
                    </div>)}</div>}
                {eligible ? <>
                    <button type="button" className="goalWorkspaceQuiet" disabled={saving} onClick={()=>
                        setBlackout({seted:true,module:"AddGoal",options:{habitId:String(habitId)}})}>
                        <PlusIcon size={20}/>{t("createForHabit")}
                    </button>
                    {!!available.length && <>
                        <div className="goalLinkExistingLabel">{t("linkExisting")}</div>
                        <div className="goalCatalogList">{available.map(goal=><button type="button" key={goal.id}
                            className="goalPickerItem" disabled={saving} onClick={()=>void choose(goal.id)}>
                            <TargetIcon size={20}/>
                            <span>{goal.name}</span>
                            <small>{goal.progress}%</small>
                        </button>)}</div>
                    </>}
                </> : <small>{t("inactiveLink")}</small>}
            </>}
    </div>;
}
