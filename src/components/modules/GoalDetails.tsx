import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilSimpleIcon, TrashIcon, XIcon, CheckIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { goalsChanged } from "../hooks/useGoalsWorkspace";
import { useHabits } from "../hooks/HabitsHook";
import { usePlans } from "../hooks/PlansHook";
import { useUser } from "../hooks/UserHook";
import { isGoalHabitAvailable, isGoalPlanAvailable } from "../ts/utils/goalLinkAvailability";
import { api } from "../ts/api";
import Checkbox from "../ts/utils/Checkbox";
import SelectList from "../ts/SelectList";
import SeekBar from "../../pages/Settings/components/SeekBar";
import type {Goal,GoalStatus} from "../../pages/HabitPage/components/Overview/goalTypes";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "../../pages/Settings/scss/seekbar.scss";
import "./scss/goalWorkspace.scss";

export default function GoalDetails() {
    const {t}=useTranslation("goals");
    const {blackout,setBlackout}=useBlackout();
    const {showNotification}=useNote();
    const {user}=useUser();
    const {habits}=useHabits();
    const {plans}=usePlans();
    const goalIdRef=useRef(blackout.options?.id);
    if (blackout.module==="GoalDetails" && blackout.options?.id) goalIdRef.current=blackout.options.id;
    const id=goalIdRef.current;
    const [goal,setGoal]=useState<Goal | null>(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(false);
    const [saving,setSaving]=useState(false);
    const [value,setValue]=useState(0);
    const [newTitle,setNewTitle]=useState("");
    const [newWeight,setNewWeight]=useState(1);
    const [editId,setEditId]=useState<number | null>(null);
    const [editTitle,setEditTitle]=useState("");
    const [editWeight,setEditWeight]=useState(1);
    const [habitId,setHabitId]=useState("");
    const [planId,setPlanId]=useState("");

    const update=(next:Goal)=>{
        setGoal(next);
        setValue(Number(next.progress_mode==="manual"?next.manual_progress:next.metric_current));
    };
    const load=useCallback(async()=>{
        if(!id) throw new Error("Goal id missing");
        const {data}=await api.get<{success:boolean;goal:Goal}>("goal-workspace/"+id);
        if(!data.success) throw new Error("Not accessible");
        update(data.goal);
        setError(false);
    },[id]);
    useEffect(()=>{
        let active=true;
        setLoading(true);
        void api.get<{success:boolean;goal:Goal}>("goal-workspace/"+id).then(({data})=>{
            if(!active || !data.success) return;
            update(data.goal);
            setError(false);
        }).catch(()=>{if(active) setError(true);}).finally(()=>{if(active)setLoading(false);});
        return ()=>{active=false;};
    },[id]);
    useEffect(()=>{
        const onChange=()=>{void load().catch(()=>setError(true));};
        window.addEventListener("at-goals-updated",onChange);
        return ()=>window.removeEventListener("at-goals-updated",onChange);
    },[load]);
    const mutate=async(path:string,method:"post"|"patch"|"delete",body?:object)=>{
        if(saving) return false;
        setSaving(true);
        try{
            const response=method==="post" ? await api.post(path,body) :
                method==="patch" ? await api.patch(path,body) : await api.delete(path);
            if(!response.data?.success) throw new Error("Goal action failed");
            if(response.data.goal) update(response.data.goal); else await load();
            goalsChanged();
            return true;
        }catch{showNotification("error",t("saveError"));return false;}
        finally{setSaving(false);}
    };
    const changeStatus=(status:GoalStatus)=>{
        if(status==="completed" && goal?.status!=="completed"){
            setBlackout({seted:true,module:"ConfirmAction",confirmAction:{
                title:t("complete"),description:t("completeConfirm"),label:t("complete"),variant:"approve",
                run:async()=>{if(!await mutate("goal-workspace/"+id,"patch",{status})) throw new Error("Cannot complete");}
            }});
        }else void mutate("goal-workspace/"+id,"patch",{status});
    };
    const deleteGoal=()=>{
        setBlackout({seted:true,module:"ConfirmAction",confirmAction:{
            title:t("delete"),description:t("deleteConfirm"),label:t("delete"),variant:"danger",
            run:async()=>{
                const {data}=await api.delete("goal-workspace/"+id);
                if(!data.success) throw new Error("Delete failed");
                goalsChanged();
                setBlackout({seted:false});
            }
        }});
    };

    const availableHabits=(habits || []).filter(item=>isGoalHabitAvailable(item,user.id) &&
        !(goal?.habits || []).some(link=>String(link.id)===String(item.id)));
    const availablePlans=plans.filter(item=>isGoalPlanAvailable(item) &&
        !(goal?.plans || []).some(link=>String(link.id)===String(item.id)));

    if(loading) return <div className="addHabitDiv addPlanDiv goalWorkspaceModal">{t("loading")}</div>;
    if(error || !goal) return <div className="addHabitDiv addPlanDiv goalWorkspaceModal">{t("loadError")}</div>;

    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal goalDetails">
        <div className="goalWorkspaceHeading">
            <h2>{goal.name}</h2>
            <div className="goalWorkspaceActions">
                <button type="button" className="goalIconButton" aria-label={t("edit")}
                    onClick={()=>setBlackout({seted:true,module:"AddGoal",options:{id:String(goal.id)}})}>
                    <PencilSimpleIcon size={24}/>
                </button>
                <button type="button" className="goalIconButton danger" aria-label={t("delete")}
                    onClick={deleteGoal}><TrashIcon size={24}/></button>
            </div>
        </div>
        {!!goal.description && <p className="goalWorkspaceText">{goal.description}</p>}
        <div className="goalWorkspaceMeta">{t("dueDate")}: {goal.due_date || t("noDate")}</div>
        <div className="goalWorkspaceField">
            <label>{t("statusLabel")}</label>
            <SelectList id="goalCurrentStatus" className="goalWorkspaceSelect"
                selected={goal.status} onChange={next=>changeStatus(next as GoalStatus)}
                arr={(["active","paused","completed","canceled","archived"] as GoalStatus[]).map(value=>({
                    value,label:t("status."+value)
                }))}/>
        </div>
        <div className="goalWorkspaceProgressHead"><span>{t("progress")}</span><span>{goal.progress}%</span></div>
        <div className="goalOverviewProgress goalDetailProgress" role="progressbar" aria-valuenow={goal.progress}
            aria-valuemin={0} aria-valuemax={100}>
            <span style={{width:goal.progress+"%"}}/>
        </div>
        {["days","streak","daily_timer","daily_counter"].includes(goal.progress_mode) && <div className="goalWorkspaceMeta">
            {t(goal.progress_mode)} · {goal.achieved_days ?? 0} / {goal.target_days ?? 30} {t("daysUnit")}
            {goal.progress_mode==="daily_timer" && " · "+(goal.daily_minutes ?? 60)+" "+t("minutesUnit")}
            {goal.progress_mode==="daily_counter" && " · "+goal.metric_target+" "+t("counterUnit")}
        </div>}
        {goal.progress_mode==="manual" && <div className="goalWorkspaceField">
            <SeekBar id="goalManualProgress" min={0} max={100} step={1}
                value={value} unit="%" disabled={saving} onChange={setValue}/>
            <button type="button" className="goalWorkspaceSave" disabled={saving || value===Number(goal.manual_progress)}
                onClick={()=>void mutate("goal-workspace/"+id,"patch",{manual_progress:value})}>{t("save")}</button>
        </div>}
        {(goal.progress_mode==="metric" || goal.progress_mode==="combined") && <div className="goalWorkspaceField">
            <label htmlFor="goalCurrentMetric">{t("current")} ({goal.metric_unit || t("value")})</label>
            <div className="goalWorkspaceMeasure">
                <input type="number" className="addHabitInput" id="goalCurrentMetric" value={value}
                    onChange={e=>setValue(Number(e.target.value))}/>
                <span>/ {goal.metric_target}</span>
                <button type="button" className="goalWorkspaceSave" disabled={saving || value===Number(goal.metric_current)}
                    onClick={()=>void mutate("goal-workspace/"+id,"patch",{metric_current:value})}>{t("save")}</button>
            </div>
        </div>}
        {(goal.progress_mode==="milestones" || goal.progress_mode==="combined") && <>
        <div className="goalWorkspaceHeading"><h3>{t("stages")}</h3></div>
        <small>{t("stagesHint")}</small>
        {(goal.stages || []).map(stage=><div className="goalStageInputs goalStageExisting" key={stage.id}>
            <Checkbox state={Boolean(stage.completed_at)} disable={saving} func={checked=>
                void mutate("goal-workspace/"+id+"/stages/"+stage.id,"patch",{completed:checked})}/>
            {editId===stage.id ? <>
                <input className="addHabitInput" maxLength={160} value={editTitle} aria-label={t("stageTitle")}
                    onChange={e=>setEditTitle(e.target.value)}/>
                <input className="addHabitInput" type="number" min={0.001} max={10000} step={0.001}
                    value={editWeight} aria-label={t("weight")}
                    onChange={e=>setEditWeight(Number(e.target.value))}/>
                <button type="button" className="goalStageRemove" disabled={saving} aria-label={t("save")}
                    onClick={async()=>{
                        if(!editTitle.trim() || editWeight<=0) return;
                        if(await mutate("goal-workspace/"+id+"/stages/"+stage.id,"patch",
                            {title:editTitle.trim(),weight:editWeight})) setEditId(null);
                    }}><CheckIcon size={20}/></button>
            </> : <>
                <span className={stage.completed_at?"goalStageChecked":""}>{stage.title}</span>
                <small>{Number(stage.weight)}</small>
                <button type="button" className="goalStageRemove" aria-label={t("edit")}
                    onClick={()=>{
                        setEditId(stage.id);setEditTitle(stage.title);setEditWeight(Number(stage.weight));
                    }}><PencilSimpleIcon size={20}/></button>
            </>}
            <button type="button" className="goalStageRemove danger" disabled={saving}
                aria-label={t("removeStage")} onClick={()=>
                void mutate("goal-workspace/"+id+"/stages/"+stage.id,"delete")}><XIcon size={20}/></button>
        </div>)}
        <div className="goalStageInputs">
            <input className="addHabitInput" value={newTitle} maxLength={160} placeholder={t("stageTitle")}
                aria-label={t("stageTitle")} onChange={e=>setNewTitle(e.target.value)}/>
            <input className="addHabitInput" type="number" min={0.001} max={10000} step={0.001}
                value={newWeight} aria-label={t("weight")}
                onChange={e=>setNewWeight(Number(e.target.value))}/>
            <button type="button" className="goalStageRemove" disabled={saving || !newTitle.trim()}
                aria-label={t("addStage")} onClick={async()=>{
                    if(await mutate("goal-workspace/"+id+"/stages","post",
                        {title:newTitle.trim(),weight:newWeight})){setNewTitle("");setNewWeight(1);}
                }}><PlusIcon size={20}/></button>
        </div>
        </>}
        <div className="goalWorkspaceHeading"><h3>{t("linkedHabits")}</h3></div>
        {(goal.habits || []).map(habit=><div className="goalWorkspaceLink" key={habit.id}>
            <span>{habit.name}</span>
            <button type="button" className="goalIconButton" aria-label={t("unlink")} disabled={saving}
                onClick={()=>void mutate("goal-workspace/"+id+"/links/habit/"+habit.id,"delete")}><XIcon size={18}/></button>
        </div>)}
        {!!availableHabits.length && <div className="goalWorkspaceLinkAdd">
            <SelectList className="goalWorkspaceSelect" selected={habitId} placeholder={t("chooseHabit")}
                onChange={setHabitId} arr={availableHabits.map(h=>({value:String(h.id),label:h.name}))}/>
            <button type="button" className="goalIconButton" aria-label={t("link")} disabled={saving || !habitId}
                onClick={()=>void mutate("goal-workspace/"+id+"/links","post",
                    {kind:"habit",id:Number(habitId)}).then(ok=>{if(ok)setHabitId("");})}><PlusIcon size={20}/></button>
        </div>}
        <div className="goalWorkspaceHeading"><h3>{t("linkedPlans")}</h3></div>
        {(goal.plans || []).map(plan=><div className="goalWorkspaceLink" key={plan.id}>
            <span>{plan.name}</span>
            <button type="button" className="goalIconButton" aria-label={t("unlink")} disabled={saving}
                onClick={()=>void mutate("goal-workspace/"+id+"/links/plan/"+plan.id,"delete")}><XIcon size={18}/></button>
        </div>)}
        {!!availablePlans.length && <div className="goalWorkspaceLinkAdd">
            <SelectList className="goalWorkspaceSelect" selected={planId} placeholder={t("choosePlan")}
                onChange={setPlanId} arr={availablePlans.map(p=>({value:String(p.id),label:p.name}))}/>
            <button type="button" className="goalIconButton" aria-label={t("link")} disabled={saving || !planId}
                onClick={()=>void mutate("goal-workspace/"+id+"/links","post",
                    {kind:"plan",id:Number(planId)}).then(ok=>{if(ok)setPlanId("");})}><PlusIcon size={20}/></button>
        </div>}
        {!!goal.events?.length && <>
            <div className="goalWorkspaceHeading"><h3>{t("history")}</h3></div>
            <div className="goalWorkspaceEvents">{goal.events.map(e=><div key={e.id}>
                <span>{t("event."+e.action,{defaultValue:e.action})}</span>
                <time>{new Date(e.created_at).toLocaleString()}</time>
            </div>)}</div>
        </>}
    </div>;
}
