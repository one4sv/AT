import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { XIcon, PlusIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { goalsChanged } from "../hooks/useGoalsWorkspace";
import { api } from "../ts/api";
import CalendarInput from "../ts/CalendarInput";
import TA from "../ts/TA";
import SelectList from "../ts/SelectList";
import Checkbox from "../ts/utils/Checkbox";
import { useHabits } from "../hooks/HabitsHook";
import { usePlans } from "../hooks/PlansHook";
import { useUser } from "../hooks/UserHook";
import { isGoalHabitAvailable, isGoalPlanAvailable } from "../ts/utils/goalLinkAvailability";
import { goalMetricCompatible, goalHabitMetricType, type Goal, type GoalMode, type GoalLinkedItem, type GoalRepeat } from "../../pages/HabitPage/components/Overview/goalTypes";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "./scss/goalWorkspace.scss";

type DraftStage = {title:string;completion_percent:number};
const dateValue = (date:Date | null) => date ? [date.getFullYear(),
    String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-") : null;

export default function AddGoal() {
    const {t}=useTranslation("goals");
    const {blackout,setBlackout}=useBlackout();
    const {showNotification}=useNote();
    const goalId=blackout.options?.id;
    const habitId=blackout.options?.habitId;
    const {habits}=useHabits();
    const {plans}=usePlans();
    const {user}=useUser();
    const [linkedHabits,setLinkedHabits]=useState<GoalLinkedItem[]>(()=>habitId?[{id:Number(habitId),name:""}]:[]);
    const [linkedPlans,setLinkedPlans]=useState<GoalLinkedItem[]>([]);

    const [autoComplete,setAutoComplete]=useState(false);
    const [repeat,setRepeat]=useState<GoalRepeat>("none");
    const [reminderDays,setReminderDays]=useState<number | null>(null);
    const [targetDays,setTargetDays]=useState(30);
    const [dailyMinutes,setDailyMinutes]=useState(120);
    const [loadError,setLoadError]=useState(false);
    const [loading,setLoading]=useState(Boolean(goalId));
    const [saving,setSaving]=useState(false);
    const [name,setName]=useState("");
    const [description,setDescription]=useState("");
    const [dueDate,setDueDate]=useState<Date | null>(null);
    const [mode,setMode]=useState<GoalMode>("manual");
    const [metricStart,setMetricStart]=useState(0);
    const [metricTarget,setMetricTarget]=useState(100);
    const [unit,setUnit]=useState("");
    const [metricShare,setMetricShare]=useState(50);
    const [stages,setStages]=useState<DraftStage[]>([]);

    useEffect(()=>{
        if(!goalId) return;
        let active=true;
        void api.get<{success:boolean;goal:Goal}>("goal-workspace/"+goalId).then(({data})=>{
            if(!active) return;
            const goal=data.goal;
            setAutoComplete(Boolean(goal.auto_complete));
            setRepeat(goal.repeat_frequency ?? "none");
            setReminderDays(goal.reminder_days ?? null);
            setName(goal.name);
            setDescription(goal.description || "");
            setDueDate(goal.due_date ? new Date(goal.due_date+"T12:00:00") : null);
            setMode(goal.progress_mode);
            setMetricStart(Number(goal.metric_start));
            setMetricTarget(Number(goal.metric_target));
            setUnit(goal.metric_unit || "");
            setMetricShare(Number(goal.metric_share)*100);
            setTargetDays(Number(goal.target_days ?? 30));
            setDailyMinutes(Number(goal.daily_minutes ?? 120));
            setLinkedHabits(goal.habits || []);
            setLinkedPlans(goal.plans || []);
        }).catch(()=>{if(active) {setLoadError(true);showNotification("error",t("loadError"));}})
          .finally(()=>{if(active) setLoading(false);});
        return ()=>{active=false;};
    },[goalId,showNotification,t]);

    const automatic=["days","streak","daily_timer","daily_counter","total_timer"].includes(mode);
    const ownHabits=(habits || []).filter(h=>isGoalHabitAvailable(h,user.id));
    const ownPlans=plans.filter(isGoalPlanAvailable);
    const availableHabits=ownHabits.filter(h=>goalMetricCompatible(mode,goalHabitMetricType(h)) && !linkedHabits.some(item=>String(item.id)===String(h.id)));
    const availablePlans=ownPlans.filter(p=>!linkedPlans.some(item=>String(item.id)===String(p.id)));
    const linkedTypes=linkedHabits.map(item=>goalHabitMetricType((habits || []).find(h=>String(h.id)===String(item.id))));
    const timerAvailable=linkedTypes.length>0 && linkedTypes.every(type=>type==="timer");
    const counterAvailable=linkedTypes.length>0 && linkedTypes.every(type=>type==="counter");
    const modeChoices=(["manual","metric","milestones","combined","days","streak","daily_timer","daily_counter","total_timer"] as GoalMode[]).filter(value=>
        ((value!=="daily_timer" && value!=="total_timer") || timerAvailable) && (value!=="daily_counter" || counterAvailable));
    const usesStages=mode==="milestones" || mode==="combined";
    const submit=async(event:FormEvent<HTMLFormElement>)=>{
        event.preventDefault();
        if(saving || loadError || !name.trim()) return;
        if(!modeChoices.includes(mode)) {showNotification("error",t("invalidAutomatic"));return;}
        if(automatic && (!linkedHabits.length || (mode!=="total_timer" && (!Number.isInteger(targetDays) || targetDays<1 || targetDays>3650)) || (mode==="daily_timer" && (!Number.isInteger(dailyMinutes) || dailyMinutes<1 || dailyMinutes>1440)))){
            showNotification("error",t("invalidAutomatic"));return;
        }
        if((mode==="metric" || mode==="combined") && metricStart===metricTarget){
            showNotification("error",t("invalidMetric"));
            return;
        }
        if(mode==="daily_counter" && (!Number.isInteger(metricTarget) || metricTarget<1 || metricTarget>1000000000)){
            showNotification("error",t("invalidCounter"));return;
        }
        if(mode==="total_timer" && (!Number.isInteger(metricTarget) || metricTarget<1 || metricTarget>1000000000)){
            showNotification("error",t("invalidTotalTimer"));return;
        }
        if(usesStages && stages.some(s=>!s.title.trim() || !Number.isFinite(s.completion_percent) || s.completion_percent<0 || s.completion_percent>100)){
            showNotification("error",t("invalidStage"));
            return;
        }
        setSaving(true);
        try{
            const payload={name:name.trim(),description,due_date:dateValue(dueDate),
                progress_mode:mode,repeat_frequency:repeat,auto_complete:autoComplete,reminder_days:dueDate?reminderDays:null,metric_start:metricStart,metric_target:metricTarget,
                metric_unit:unit,metric_share:metricShare/100,target_days:targetDays,daily_minutes:dailyMinutes,
                habit_ids:linkedHabits.map(h=>h.id),plan_ids:linkedPlans.map(p=>p.id)};
            const response=goalId ? await api.patch("goal-workspace/"+goalId,payload) :
                await api.post("goal-workspace",{...payload,
                    stages:usesStages ? stages.map(s=>({title:s.title.trim(),completion_percent:s.completion_percent})) : []});
            if(!response.data?.success) throw new Error("Goal save failed");
            goalsChanged();
            setBlackout({seted:false});
            showNotification("success",t(goalId?"updated":"created"));
        }catch{
            showNotification("error",t("saveError"));
        }finally{setSaving(false);}
    };

    return <form className="addHabitDiv addPlanDiv goalWorkspaceModal goalCreate" onSubmit={event=>void submit(event)}>
        <h2>{t(goalId?"edit":"create")}</h2>
        {loading ? <span>{t("loading")}</span> : loadError ? <span>{t("loadError")}</span> : <>
            <div className="addHabitWrapper">
                <label htmlFor="goalName">{t("name")}</label>
                <input id="goalName" className="addHabitInput" maxLength={160} required
                    value={name} onChange={event=>setName(event.target.value)}/>
            </div>
            <div className="addHabitWrapper">
                <label htmlFor="goalDescription">{t("description")}</label>
                <TA id="goalDescription" className="addHabitInput goalWorkspaceDescription"
                    maxLength={1200} value={description} minHeight={5} maxHeight={22}
                    onChange={event=>setDescription(event.target.value)}/>
            </div>
            <div className="addHabitWrapper">
                <label htmlFor="goalDue">{t("dueDate")}</label>
                <CalendarInput id="goalDue" value={dueDate} onChange={setDueDate}
                    className="addHabitInput" placeholder={t("optional")}/>
            </div>
            {dueDate && <div className="addHabitWrapper">
                <label>{t("deadlineReminder")}</label>
                <SelectList className="goalWorkspaceSelect" selected={reminderDays===null?"off":String(reminderDays)}
                    arr={[{value:"off",label:t("reminderOff")},...[0,1,3,7,14,30].map(days=>({value:String(days),label:t("reminderBefore",{count:days})}))]}
                    onChange={v=>setReminderDays(v==="off"?null:Number(v))}/>
            </div>}
            <div className="addHabitWrapper">
                <label>{t("repeatLabel")}</label>
                <SelectList className="goalWorkspaceSelect" selected={repeat}
                    arr={["none","daily","weekly","monthly"].map(value=>({value,label:t("repeat."+value)}))}
                    onChange={value=>setRepeat(value as GoalRepeat)}/>
                {repeat!=="none" && <small>{t("repeatHint")}</small>}
            </div>
            <div className="goalWorkspaceLink">
                <Checkbox state={autoComplete} setState={setAutoComplete}/>
                <span>{t("autoComplete")}</span>
            </div>
            <div className="addHabitWrapper">
                <label>{t("progressMode")}</label>
                <SelectList id="goalMode" className="goalWorkspaceSelect" selected={mode}
                    onChange={value=>setMode(value as GoalMode)}
                    arr={modeChoices.map(value=>({
                        value,label:t(value)
                    }))}/>
            </div>
            {(mode==="metric" || mode==="combined") && <>
                <div className="goalWorkspaceMetrics">
                    <div className="addHabitWrapper">
                        <label htmlFor="goalStart">{t("start")}</label>
                        <input id="goalStart" className="addHabitInput" type="number"
                            value={metricStart} onChange={e=>setMetricStart(Number(e.target.value))}/>
                    </div>
                    <div className="addHabitWrapper">
                        <label htmlFor="goalTarget">{t("target")}</label>
                        <input id="goalTarget" className="addHabitInput" type="number"
                            value={metricTarget} onChange={e=>setMetricTarget(Number(e.target.value))}/>
                    </div>
                </div>
                <div className="addHabitWrapper">
                    <label htmlFor="goalUnit">{t("unit")}</label>
                    <input id="goalUnit" className="addHabitInput" value={unit} maxLength={24}
                        onChange={e=>setUnit(e.target.value)}/>
                </div>
            </>}
            {mode==="combined" && <div className="addHabitWrapper">
                <label htmlFor="goalShare">{t("metricShare")}</label>
                <input id="goalShare" className="addHabitInput" type="number" min={0} max={100} step={5}
                    value={metricShare} onChange={e=>setMetricShare(Number(e.target.value))}/>
            </div>}
            {automatic && modeChoices.includes(mode) && <div className="goalWorkspaceField">
                {mode!=="total_timer" && <>
                    <label htmlFor="goalTargetDays">{t("targetDays")}</label>
                    <input id="goalTargetDays" className="addHabitInput" type="number" min={1} max={3650}
                        value={targetDays} onChange={e=>setTargetDays(Number(e.target.value))}/>
                </>}
                {mode==="total_timer" && <>
                    <label htmlFor="goalTotalMinutes">{t("totalMinutes")}</label>
                    <input id="goalTotalMinutes" className="addHabitInput" type="number" min={1} max={1000000000} step={1}
                        value={metricTarget} onChange={e=>setMetricTarget(Number(e.target.value))}/>
                </>}
                {mode==="daily_timer" && <>
                    <label htmlFor="goalDailyMinutes">{t("dailyMinutes")}</label>
                    <input id="goalDailyMinutes" className="addHabitInput" type="number" min={1} max={1440}
                        value={dailyMinutes} onChange={e=>setDailyMinutes(Number(e.target.value))}/>
                </>}
                {mode==="daily_counter" && <>
                    <label htmlFor="goalDailyCounter">{t("dailyCounterTarget")}</label>
                    <input id="goalDailyCounter" className="addHabitInput" type="number" min={1} max={1000000000} step={1}
                        value={metricTarget} onChange={e=>setMetricTarget(Number(e.target.value))}/>
                </>}
                <small>{t(mode==="daily_counter"?"counterHint":mode==="total_timer"?"totalTimerHint":"automaticHint")}</small>
            </div>}
            <div className="goalWorkspaceField">
                <label>{t("linkedHabits")}</label>
                {linkedHabits.map(h=><div key={h.id} className="goalWorkspaceLink">
                    <span>{ownHabits.find(item=>item.id===h.id)?.name || h.name || String(h.id)}</span>
                    <button type="button" className="goalIconButton" aria-label={t("unlink")}
                        onClick={()=>setLinkedHabits(old=>old.filter(item=>item.id!==h.id))}><XIcon size={24}/></button>
                </div>)}
                {!!availableHabits.length && <SelectList key={"habit-"+linkedHabits.map(h=>h.id).join(",")}
                    className="goalWorkspaceSelect" placeholder={t("chooseHabit")}
                    arr={availableHabits.map(h=>({value:String(h.id),label:h.name}))}
                    onChange={value=>{
                        const item=availableHabits.find(h=>String(h.id)===value);
                        if(item) setLinkedHabits(old=>old.some(h=>String(h.id)===value)?old:[...old,{id:item.id,name:item.name}]);
                    }}/>}
                <label>{t("linkedPlans")}</label>
                {linkedPlans.map(p=><div key={p.id} className="goalWorkspaceLink">
                    <span>{ownPlans.find(item=>item.id===p.id)?.name || p.name}</span>
                    <button type="button" className="goalIconButton" aria-label={t("unlink")}
                        onClick={()=>setLinkedPlans(old=>old.filter(item=>item.id!==p.id))}><XIcon size={24}/></button>
                </div>)}
                {!!availablePlans.length && <SelectList key={"plan-"+linkedPlans.map(p=>p.id).join(",")}
                    className="goalWorkspaceSelect" placeholder={t("choosePlan")}
                    arr={availablePlans.map(p=>({value:String(p.id),label:p.name}))}
                    onChange={value=>{
                        const item=availablePlans.find(p=>String(p.id)===value);
                        if(item) setLinkedPlans(old=>old.some(p=>String(p.id)===value)?old:[...old,{id:item.id,name:item.name}]);
                    }}/>}
            </div>
            {!goalId && usesStages && <div className="goalWorkspaceStages">
                <label>{t("stages")}</label>
                <small>{t("stagesHint")}</small>
                {stages.map((s,i)=><div className="goalStageInputs" key={i}>
                    <input className="addHabitInput" type="text" maxLength={160}
                        placeholder={t("stageTitle")} aria-label={t("stageTitle")} value={s.title}
                        onChange={e=>setStages(old=>old.map((v,j)=>j===i?{...v,title:e.target.value}:v))}/>
                    <div className="goalStagePercent">
                        <input className="addHabitInput" type="number" min={0} max={100} step={0.01}
                            aria-label={t("stagePercent")} value={s.completion_percent}
                            onChange={e=>setStages(old=>old.map((v,j)=>j===i?{...v,completion_percent:Number(e.target.value)}:v))}/>
                        <span aria-hidden="true">%</span>
                    </div>
                    <button type="button" className="goalStageRemove" aria-label={t("removeStage")}
                        onClick={()=>setStages(old=>old.filter((_,j)=>j!==i))}><XIcon size={20}/></button>
                </div>)}
                <button type="button" className="goalWorkspaceQuiet" onClick={()=>
                    setStages(old=>[...old,{title:"",completion_percent:100}])}><PlusIcon size={18}/>{t("addStage")}</button>
            </div>}
            <button className="addHabitSave goalWorkspaceSubmit" type="submit"
                disabled={saving || !name.trim() || !modeChoices.includes(mode)}>{t(saving?"saving":"save")}</button>
        </>}
    </form>;
}
