import { numberInputValue } from "../ts/utils/numberInputValue";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatAppDate,formatAppTime } from "../ts/utils/dateToStr";
import { PlusIcon, PencilSimpleIcon, TrashIcon, XIcon, CheckIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { goalsChanged, previewGoal } from "../hooks/useGoalsWorkspace";
import { useHabits } from "../hooks/HabitsHook";
import { usePlans } from "../hooks/PlansHook";
import { useUser } from "../hooks/UserHook";
import { isGoalHabitAvailable, isGoalPlanAvailable } from "../ts/utils/goalLinkAvailability";
import { api } from "../ts/api";
import Checkbox from "../ts/utils/Checkbox";
import SelectList from "../ts/SelectList";
import SeekBar from "../../pages/Settings/components/SeekBar";
import {goalMetricCompatible,goalHabitMetricType,previewGoalProgress,stagePercentages,type Goal,type GoalStatus} from "../../pages/HabitPage/components/Overview/goalTypes";
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
    const [confirmed,setGoal]=useState<Goal | null>(null);
    const [pending,setPending]=useState<Goal | null>(null);
    const writing=useRef(false);
    const revision=useRef(0);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(false);
    const [saving,setSaving]=useState(false);
    const [value,setValue]=useState<number | "">(0);
    const [newTitle,setNewTitle]=useState("");
    const [newPercent,setNewPercent]=useState<number | "">(100);
    const [editId,setEditId]=useState<number | null>(null);
    const [editTitle,setEditTitle]=useState("");
    const [editPercent,setEditPercent]=useState<number | "">(100);
    const [habitId,setHabitId]=useState("");
    const [planId,setPlanId]=useState("");

    const goal=pending ?? confirmed;
    const lastValue=useRef<{id:number;value:number} | null>(null);
    const update=(next:Goal)=>{
        setGoal(next);
        const serverValue=Number(next.progress_mode==="manual"?next.manual_progress:next.metric_current);
        const previous=lastValue.current;
        lastValue.current={id:next.id,value:serverValue};
        setValue(draft=>previous?.id===next.id && draft!==previous.value ? draft : serverValue);
    };
    const load=useCallback(async()=>{
        if(!id) throw new Error("Goal id missing");
        const version=++revision.current;
        const {data}=await api.get<{success:boolean;goal:Goal}>("goal-workspace/"+id);
        if(!data.success) throw new Error("Not accessible");
        if(version!==revision.current || writing.current) return;
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
        const onChange=()=>{if(!writing.current) void load().catch(()=>setError(true));};
        window.addEventListener("at-goals-updated",onChange);
        return ()=>window.removeEventListener("at-goals-updated",onChange);
    },[load]);
    const mutate=async(path:string,method:"post"|"patch"|"delete",body?:object,patch?:Partial<Goal>)=>{
        if(writing.current || !goal) return false;
        writing.current=true;
        revision.current++;
        const next={...goal,...patch};
        next.progress=previewGoalProgress(next);
        setPending(next);
        const finish=previewGoal(user.id,goal.id,{...patch,progress:next.progress});
        setSaving(true);
        try{
            const response=method==="post" ? await api.post(path,body) :
                method==="patch" ? await api.patch(path,body) : await api.delete(path);
            if(!response.data?.success) throw new Error("Goal action failed");
            finish(response.data.goal);
            if(response.data.goal) update(response.data.goal);
            goalsChanged();
            return true;
        }catch{finish();showNotification("error",t("saveError"));return false;}
        finally{writing.current=false;setPending(null);setSaving(false);}
    };
    const changeStatus=(status:GoalStatus)=>{
        if(status==="completed" && goal?.status!=="completed"){
            setBlackout({seted:true,module:"ConfirmAction",confirmAction:{
                title:t("complete"),description:t("completeConfirm"),label:t("complete"),variant:"approve",
                run:async()=>{if(!await mutate("goal-workspace/"+id,"patch",{status},{status})) throw new Error("Cannot complete");}
            }});
        }else void mutate("goal-workspace/"+id,"patch",{status},{status});
    };
    const deleteGoal=()=>{
        setBlackout({seted:true,module:"ConfirmAction",confirmAction:{
            title:t("delete"),description:t("deleteConfirm"),label:t("delete"),variant:"danger",
            run:async()=>{
                if(!goal) return;
                const finish=previewGoal(user.id,goal.id,null);
                try{
                    const {data}=await api.delete("goal-workspace/"+id);
                    if(!data.success) throw new Error("Delete failed");
                    finish(null);
                }catch(error){finish();throw error;}
                goalsChanged();
                setBlackout({seted:false});
            }
        }});
    };

    const availableHabits=(habits || []).filter(item=>isGoalHabitAvailable(item,user.id) &&
        (!goal || goalMetricCompatible(goal.progress_mode,goalHabitMetricType(item))) &&
        !(goal?.habits || []).some(link=>String(link.id)===String(item.id)));
    const availablePlans=plans.filter(item=>isGoalPlanAvailable(item) &&
        !(goal?.plans || []).some(link=>String(link.id)===String(item.id)));

    if(loading) return <div className="addHabitDiv addPlanDiv goalWorkspaceModal">{t("loading")}</div>;
    if(!goal) return <div className="addHabitDiv addPlanDiv goalWorkspaceModal">{t("loadError")}</div>;

    const stages=goal.stages || [];
    const percentages=stagePercentages(stages);
    const canEdit=goal.can_edit!==false;
    const canProgress=goal.can_progress!==false;
    const canChangeLinks=canEdit && !goal.shared_habit_id;
    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal goalDetails">
        <div className="goalWorkspaceHeading">
            <h2>{goal.name}</h2>
            <div className="goalWorkspaceActions">
                <button type="button" className="goalIconButton" aria-label={t("history")} title={t("history")}
                    onClick={()=>setBlackout({seted:true,module:"GoalHistory",options:{id:String(goal.id)}})}>
                    <ClockCounterClockwiseIcon size={24}/>
                </button>
                {canEdit && <><button type="button" className="goalIconButton" aria-label={t("edit")}
                    onClick={()=>setBlackout({seted:true,module:"AddGoal",options:{id:String(goal.id)}})}>
                    <PencilSimpleIcon size={24}/>
                </button>
                <button type="button" className="goalIconButton danger" aria-label={t("delete")}
                    onClick={deleteGoal}><TrashIcon size={24}/></button></>}
            </div>
        </div>
        {goal.can_manage_definition && goal.template_goal_id && <button type="button" className="goalWorkspaceQuiet"
            onClick={()=>setBlackout({seted:true,module:"GoalDetails",options:{id:String(goal.template_goal_id)}})}>{t("manageSharedDefinition")}</button>}
        {error && <small>{t("loadError")}</small>}
        {!!goal.description && <p className="goalWorkspaceText">{goal.description}</p>}
        <div className="goalWorkspaceMeta">{t("dueDate")}: {goal.due_date || t("noDate")}</div>
        {goal.repeat_frequency && goal.repeat_frequency!=="none" && <div className="goalWorkspaceMeta">
            {t("repeatLabel")}: {t("repeat."+goal.repeat_frequency)}
            {goal.repeat_next_at && <> · {t("nextReset")}: {new Date(goal.repeat_next_at).toLocaleString()}</>}
        </div>}
        <div className="goalWorkspaceField">
            <label>{t("statusLabel")}</label>
            <SelectList id="goalCurrentStatus" className="goalWorkspaceSelect"
                selected={goal.status} showOnly={!canProgress && !canEdit} onChange={next=>changeStatus(next as GoalStatus)}
                arr={(["active","paused","completed","canceled","archived"] as GoalStatus[]).filter(value=>canEdit || value==="active" || value==="completed" || value===goal.status).map(value=>({
                    value,label:t("status."+value)
                }))}/>
        </div>
        <div className="goalWorkspaceProgressHead"><span>{t("progress")}</span><span>{goal.progress}%</span></div>
        <div className="goalOverviewProgress goalDetailProgress" role="progressbar" aria-valuenow={goal.progress}
            aria-valuemin={0} aria-valuemax={100}>
            <span style={{width:goal.progress+"%"}}/>
        </div>
        {goal.today_progress!=null && <div className="goalWorkspaceField">
            <div className="goalWorkspaceProgressHead"><span>{t("todayProgress")}</span><span>{goal.today_progress}%</span></div>
            <div className="goalOverviewProgress goalDetailProgress"><span style={{width:goal.today_progress+"%"}}/></div>
        </div>}
        {goal.completed_at && <div className="goalWorkspaceMeta">{t("completedOn")}: {new Date(goal.completed_at).toLocaleDateString()}</div>}
        {["days","streak","daily_timer","daily_counter"].includes(goal.progress_mode) && <div className="goalWorkspaceMeta">
            {t(goal.progress_mode)} · {goal.achieved_days ?? 0} / {goal.target_days ?? 30} {t("daysUnit")}
            {goal.progress_mode==="daily_timer" && " · "+(goal.daily_minutes ?? 60)+" "+t("minutesUnit")}
            {goal.progress_mode==="daily_counter" && " · "+goal.metric_target+" "+t("counterUnit")}
        </div>}
        {goal.progress_mode==="total_timer" && <div className="goalWorkspaceMeta">
            {t("total_timer")} · {goal.achieved_minutes ?? 0} / {goal.metric_target} {t("totalMinutesUnit")}
        </div>}
        {goal.progress_mode==="manual" && <div className="goalWorkspaceField">
            <SeekBar id="goalManualProgress" min={0} max={100} step={1}
                value={Number(value)} unit="%" disabled={saving || !canProgress} onChange={setValue}/>
            <button type="button" className="goalWorkspaceSave" disabled={saving || !canProgress || value===Number(goal.manual_progress)}
                onClick={()=>void mutate("goal-workspace/"+id,"patch",{manual_progress:value},{manual_progress:Number(value)})}>{t("save")}</button>
        </div>}
        {(goal.progress_mode==="metric" || goal.progress_mode==="combined") && <div className="goalWorkspaceField">
            <label htmlFor="goalCurrentMetric">{t("current")} ({goal.metric_unit || t("value")})</label>
            <div className="goalWorkspaceMeasure">
                <input type="number" className="addHabitInput" id="goalCurrentMetric" value={value} disabled={!canProgress}
                    onChange={e=>setValue(numberInputValue(e.target))}/>
                <span>/ {goal.metric_target}</span>
                <button type="button" className="goalWorkspaceSave" disabled={saving || !canProgress || value==="" || !Number.isFinite(value) || value===Number(goal.metric_current)}
                    onClick={()=>void mutate("goal-workspace/"+id,"patch",{metric_current:value},{metric_current:Number(value)})}>{t("save")}</button>
            </div>
        </div>}
        {(goal.progress_mode==="milestones" || goal.progress_mode==="combined") && <>
        <div className="goalWorkspaceHeading"><h3>{t("stages")}</h3></div>
        <small>{t("stagesHint")}</small>
        {(goal.stages || []).map(stage=><div className={"goalStageInputs goalStageExisting"+(!canEdit?" goalStageReadOnly":"")} key={stage.id}>
            <Checkbox state={Boolean(stage.completed_at)} disable={saving || !canProgress} func={checked=>
                void mutate("goal-workspace/"+id+"/stages/"+stage.id,"patch",{completed:checked},
                    {stages:stages.map(item=>item.id===stage.id?{...item,completed_at:checked?new Date().toISOString():null}:item)})}/>
            {editId===stage.id ? <>
                <input className="addHabitInput" maxLength={160} value={editTitle} aria-label={t("stageTitle")}
                    onChange={e=>setEditTitle(e.target.value)}/>
                <div className="goalStagePercent">
                    <input className="addHabitInput" type="number" min={0} max={100} step={0.01}
                        value={editPercent} aria-label={t("stagePercent")}
                        onChange={e=>setEditPercent(numberInputValue(e.target))}/>
                    <span aria-hidden="true">%</span>
                </div>
                <button type="button" className="goalStageRemove" disabled={saving || !editTitle.trim() || editPercent==="" || editPercent<0 || editPercent>100} aria-label={t("save")}
                    onClick={async()=>{
                        if(!editTitle.trim() || !Number.isFinite(editPercent) || editPercent==="" || editPercent<0 || editPercent>100) return;
                        if(await mutate("goal-workspace/"+id+"/stages/"+stage.id,"patch",
                            {title:editTitle.trim(),completion_percent:editPercent},
                            {stages:stages.map(item=>item.id===stage.id?{...item,title:editTitle.trim(),completion_percent:editPercent}:item)})) setEditId(null);
                    }}><CheckIcon size={20}/></button>
            </> : <>
                <div className="goalStageTitle">
                    <button type="button" className={"goalCheckboxLabel"+(stage.completed_at?" goalStageChecked":"")} disabled={saving || !canProgress}
                        onClick={()=>void mutate("goal-workspace/"+id+"/stages/"+stage.id,"patch",{completed:!stage.completed_at},
                            {stages:stages.map(item=>item.id===stage.id?{...item,completed_at:stage.completed_at?null:new Date().toISOString()}:item)})}>{stage.title}</button>
                    {stage.completed_at && <small>{formatAppDate(stage.completed_at)} · {formatAppTime(stage.completed_at)}</small>}
                </div>
                <small>{percentages.get(stage.id)}%</small>
                {canEdit && <button type="button" className="goalStageRemove" aria-label={t("edit")}
                    onClick={()=>{
                        setEditId(stage.id);setEditTitle(stage.title);setEditPercent(percentages.get(stage.id) ?? 0);
                    }}><PencilSimpleIcon size={20}/></button>}
            </>}
            {canEdit && <button type="button" className="goalStageRemove danger" disabled={saving}
                aria-label={t("removeStage")} onClick={()=>
                void mutate("goal-workspace/"+id+"/stages/"+stage.id,"delete",undefined,{stages:stages.filter(item=>item.id!==stage.id)})}><XIcon size={20}/></button>}
        </div>)}
        {canEdit && <div className="goalStageInputs">
            <input className="addHabitInput" value={newTitle} maxLength={160} placeholder={t("stageTitle")}
                aria-label={t("stageTitle")} onChange={e=>setNewTitle(e.target.value)}/>
            <div className="goalStagePercent">
                <input className="addHabitInput" type="number" min={0} max={100} step={0.01}
                    value={newPercent} aria-label={t("stagePercent")}
                    onChange={e=>setNewPercent(numberInputValue(e.target))}/>
                <span aria-hidden="true">%</span>
            </div>
            <button type="button" className="goalStageRemove" disabled={saving || !newTitle.trim() || !Number.isFinite(newPercent) || newPercent==="" || newPercent<0 || newPercent>100}
                aria-label={t("addStage")} onClick={async()=>{
                    if(await mutate("goal-workspace/"+id+"/stages","post",
                        {title:newTitle.trim(),completion_percent:newPercent},{stages:[...stages,{
                            id:-1,goal_id:goal.id,title:newTitle.trim(),weight:1,completion_percent:Number(newPercent),
                            position:Math.max(0,...stages.map(stage=>stage.position))+1,completed_at:null}] })){setNewTitle("");setNewPercent(100);}
                }}><PlusIcon size={20}/></button>
        </div>}
        </>}
        <div className="goalWorkspaceHeading"><h3>{t("linkedHabits")}</h3></div>
        {(goal.habits || []).map(habit=><div className="goalWorkspaceLink" key={habit.id}>
            <span>{habit.name}</span>
            {canChangeLinks && <button type="button" className="goalIconButton" aria-label={t("unlink")} disabled={saving}
                onClick={()=>void mutate("goal-workspace/"+id+"/links/habit/"+habit.id,"delete",undefined,
                    {habits:goal.habits?.filter(item=>item.id!==habit.id),habit_ids:goal.habits?.filter(item=>item.id!==habit.id).map(item=>item.id)})}><XIcon size={18}/></button>}
        </div>)}
        {canChangeLinks && !!availableHabits.length && <div className="goalWorkspaceLinkAdd">
            <SelectList className="goalWorkspaceSelect" selected={habitId} placeholder={t("chooseHabit")}
                onChange={setHabitId} arr={availableHabits.map(h=>({value:String(h.id),label:h.name}))}/>
            <button type="button" className="goalIconButton" aria-label={t("link")} disabled={saving || !habitId}
                onClick={()=>void mutate("goal-workspace/"+id+"/links","post",
                    {kind:"habit",id:Number(habitId)},
                    {habits:[...(goal.habits || []),{id:Number(habitId),name:availableHabits.find(item=>item.id===Number(habitId))?.name || ""}],habit_ids:[...(goal.habits || []).map(item=>item.id),Number(habitId)]}).then(ok=>{if(ok)setHabitId("");})}><PlusIcon size={20}/></button>
        </div>}
        <div className="goalWorkspaceHeading"><h3>{t("linkedPlans")}</h3></div>
        {(goal.plans || []).map(plan=><div className="goalWorkspaceLink" key={plan.id}>
            <span>{plan.name}</span>
            {canChangeLinks && <button type="button" className="goalIconButton" aria-label={t("unlink")} disabled={saving}
                onClick={()=>void mutate("goal-workspace/"+id+"/links/plan/"+plan.id,"delete",undefined,
                    {plans:goal.plans?.filter(item=>item.id!==plan.id)})}><XIcon size={18}/></button>}
        </div>)}
        {canChangeLinks && !!availablePlans.length && <div className="goalWorkspaceLinkAdd">
            <SelectList className="goalWorkspaceSelect" selected={planId} placeholder={t("choosePlan")}
                onChange={setPlanId} arr={availablePlans.map(p=>({value:String(p.id),label:p.name}))}/>
            <button type="button" className="goalIconButton" aria-label={t("link")} disabled={saving || !planId}
                onClick={()=>void mutate("goal-workspace/"+id+"/links","post",
                    {kind:"plan",id:Number(planId)},
                    {plans:[...(goal.plans || []),{id:Number(planId),name:availablePlans.find(item=>item.id===Number(planId))?.name || ""}]}).then(ok=>{if(ok)setPlanId("");})}><PlusIcon size={20}/></button>
        </div>}
    </div>;
}
