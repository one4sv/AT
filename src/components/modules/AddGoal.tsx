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
import { useHabits } from "../hooks/HabitsHook";
import { usePlans } from "../hooks/PlansHook";
import { useUser } from "../hooks/UserHook";
import { appTimeZone, todayStrFunc } from "../ts/utils/dateToStr";
import type { Goal, GoalMode } from "../../pages/HabitPage/components/Overview/goalTypes";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "./scss/goalWorkspace.scss";

type DraftStage = {title:string;weight:number};
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
    const [linkedHabits,setLinkedHabits]=useState<number[]>(habitId?[Number(habitId)]:[]);
    const [linkedPlans,setLinkedPlans]=useState<number[]>([]);
    const [linkOpen,setLinkOpen]=useState(Boolean(habitId || goalId));
    const [trackingHabit,setTrackingHabit]=useState(habitId || "");
    const [trackingDays,setTrackingDays]=useState(30);
    const [trackingMinutes,setTrackingMinutes]=useState(120);
    const [trackingStart,setTrackingStart]=useState(todayStrFunc);
    const [trackingZone,setTrackingZone]=useState(appTimeZone);
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
    const [originalGoal,setOriginalGoal]=useState<Goal | null>(null);
    const automatic=["days","streak","daily_timer"].includes(mode);
    const ownedHabits=(habits || []).filter(h=>h.user_id===user.id);
    const ownedPlans=plans.filter(plan=>plan.is_owner || plan.owner_id===user.id);
    const trackingOptions=ownedHabits.filter(h=>linkedHabits.includes(h.id) &&
        (mode!=="daily_timer" || h.habits_settings?.metric_type==="timer"));
    const addHabit=(id:string)=>{
        const value=Number(id);
        setLinkedHabits(previous=>previous.includes(value)?previous:[...previous,value]);
        if(!trackingHabit) setTrackingHabit(id);
    };
    const addPlan=(id:string)=>setLinkedPlans(previous=>previous.includes(Number(id))?previous:[...previous,Number(id)]);
    const removeHabit=(id:number)=>{
        setLinkedHabits(previous=>previous.filter(value=>value!==id));
        if(trackingHabit===String(id)) setTrackingHabit("");
    };

    useEffect(()=>{
        if(!goalId) return;
        let active=true;
        void api.get<{success:boolean;goal:Goal}>("goal-workspace/"+goalId).then(({data})=>{
            if(!active) return;
            const goal=data.goal;
            setName(goal.name);
            setDescription(goal.description || "");
            setDueDate(goal.due_date ? new Date(goal.due_date+"T12:00:00") : null);
            setMode(goal.progress_mode);
            setMetricStart(Number(goal.metric_start));
            setMetricTarget(Number(goal.metric_target));
            setUnit(goal.metric_unit || "");
            setMetricShare(Number(goal.metric_share)*100);
            setOriginalGoal(goal);
            setLinkedHabits((goal.habits || []).map(h=>Number(h.id)));
            setLinkedPlans((goal.plans || []).map(plan=>Number(plan.id)));
            setTrackingHabit(goal.tracking_habit_id?String(goal.tracking_habit_id):"");
            setTrackingDays(Number(goal.tracking_days || 30));
            setTrackingMinutes(Number(goal.tracking_minutes || 120));
            setTrackingStart(goal.tracking_start || todayStrFunc());
            setTrackingZone(goal.tracking_timezone || appTimeZone());
        }).catch(()=>{if(active) showNotification("error",t("loadError"));})
          .finally(()=>{if(active) setLoading(false);});
        return ()=>{active=false;};
    },[goalId,showNotification,t]);

    const submit=async(event:FormEvent<HTMLFormElement>)=>{
        event.preventDefault();
        if(saving || !name.trim()) return;
        if((mode==="metric" || mode==="combined") && metricStart===metricTarget){
            showNotification("error",t("invalidMetric"));
            return;
        }
        if(stages.some(s=>!s.title.trim() || !Number.isFinite(s.weight) || s.weight<=0)){
            showNotification("error",t("invalidStage"));
            return;
        }
        if(automatic && (!trackingOptions.some(h=>String(h.id)===trackingHabit) ||
            !Number.isInteger(trackingDays) || trackingDays<1 || trackingDays>3660 ||
            (mode==="daily_timer" && (!Number.isInteger(trackingMinutes) || trackingMinutes<1 || trackingMinutes>1440)))){
            showNotification("error",t("invalidTracking"));
            return;
        }
        setSaving(true);
        try{
            const payload={name:name.trim(),description,due_date:dateValue(dueDate),
                progress_mode:mode,metric_start:metricStart,metric_target:metricTarget,
                metric_unit:unit,metric_share:metricShare/100,
                habit_ids:linkedHabits,plan_ids:linkedPlans,
                tracking_habit_id:automatic?Number(trackingHabit):null,
                tracking_days:trackingDays,tracking_minutes:trackingMinutes,
                tracking_start:automatic?(originalGoal?.progress_mode===mode &&
                    String(originalGoal.tracking_habit_id)===trackingHabit?trackingStart:todayStrFunc()):null,
                tracking_timezone:automatic && originalGoal?.progress_mode===mode &&
                    String(originalGoal.tracking_habit_id)===trackingHabit?trackingZone:appTimeZone()};
            const response=goalId ? await api.patch("goal-workspace/"+goalId,payload) :
                await api.post("goal-workspace",{...payload,
                    stages:stages.map(s=>({title:s.title.trim(),weight:s.weight}))});
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
        {loading ? <span>{t("loading")}</span> : <>
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
            <div className="addHabitWrapper">
                <label>{t("progressMode")}</label>
                <SelectList id="goalMode" className="goalWorkspaceSelect" selected={mode}
                    onChange={value=>{setMode(value as GoalMode);if(["days","streak","daily_timer"].includes(value))setLinkOpen(true);}}
                    arr={(["manual","metric","milestones","combined","days","streak","daily_timer"] as GoalMode[]).map(value=>({
                        value,label:t(value)
                    }))}/>
            </div>
            <button type="button" className="goalWorkspaceQuiet" onClick={()=>setLinkOpen(open=>!open)}>
                <PlusIcon size={20}/>{t("linkActions")}
            </button>
            {(linkOpen || linkedHabits.length>0 || linkedPlans.length>0 || automatic) && <div className="goalWorkspaceField">
                <label>{t("linkedHabits")}</label>
                {linkedHabits.map(id=><div className="goalWorkspaceLink" key={id}>
                    <span>{ownedHabits.find(h=>h.id===id)?.name || originalGoal?.habits?.find(h=>h.id===id)?.name || String(id)}</span>
                    <button type="button" className="goalIconButton" aria-label={t("unlink")} onClick={()=>removeHabit(id)}><XIcon size={24}/></button>
                </div>)}
                {ownedHabits.some(h=>!linkedHabits.includes(h.id)) && <SelectList key={"habit-"+linkedHabits.join(",")}
                    className="goalWorkspaceSelect" placeholder={t("chooseHabit")}
                    arr={ownedHabits.filter(h=>!linkedHabits.includes(h.id)).map(h=>({value:String(h.id),label:h.name}))}
                    onChange={addHabit}/>}
                <label>{t("linkedPlans")}</label>
                {linkedPlans.map(id=><div className="goalWorkspaceLink" key={id}>
                    <span>{ownedPlans.find(plan=>plan.id===id)?.name || originalGoal?.plans?.find(plan=>plan.id===id)?.name || String(id)}</span>
                    <button type="button" className="goalIconButton" aria-label={t("unlink")}
                        onClick={()=>setLinkedPlans(previous=>previous.filter(value=>value!==id))}><XIcon size={24}/></button>
                </div>)}
                {ownedPlans.some(plan=>!linkedPlans.includes(plan.id)) && <SelectList key={"plan-"+linkedPlans.join(",")}
                    className="goalWorkspaceSelect" placeholder={t("choosePlan")}
                    arr={ownedPlans.filter(plan=>!linkedPlans.includes(plan.id)).map(plan=>({value:String(plan.id),label:plan.name}))}
                    onChange={addPlan}/>}
            </div>}
            {automatic && <div className="goalWorkspaceField">
                <label>{t("trackingHabit")}</label>
                <SelectList key={mode+"-"+trackingOptions.map(h=>h.id).join(",")} className="goalWorkspaceSelect"
                    selected={trackingHabit} placeholder={t("chooseHabit")}
                    arr={trackingOptions.map(h=>({value:String(h.id),label:h.name}))} onChange={setTrackingHabit}/>
                {!trackingOptions.length && <small>{t(mode==="daily_timer"?"timerHabitRequired":"trackingHabitRequired")}</small>}
                <label htmlFor="goalTrackingDays">{t("trackingDays")}</label>
                <input id="goalTrackingDays" className="addHabitInput" type="number" min={1} max={3660} step={1} required
                    value={trackingDays} onChange={e=>setTrackingDays(Number(e.target.value))}/>
                {mode==="daily_timer" && <>
                    <label htmlFor="goalTrackingMinutes">{t("trackingMinutes")}</label>
                    <input id="goalTrackingMinutes" className="addHabitInput" type="number" min={1} max={1440} step={1} required
                        value={trackingMinutes} onChange={e=>setTrackingMinutes(Number(e.target.value))}/>
                </>}
                <small>{t("trackingHelp")}</small>
            </div>}
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
            {!goalId && <div className="goalWorkspaceStages">
                <label>{t("stages")}</label>
                {stages.map((s,i)=><div className="goalStageInputs" key={i}>
                    <input className="addHabitInput" type="text" maxLength={160}
                        placeholder={t("stageTitle")} aria-label={t("stageTitle")} value={s.title}
                        onChange={e=>setStages(old=>old.map((v,j)=>j===i?{...v,title:e.target.value}:v))}/>
                    <input className="addHabitInput" type="number" min={0.001} max={10000} step={0.5}
                        aria-label={t("weight")} value={s.weight}
                        onChange={e=>setStages(old=>old.map((v,j)=>j===i?{...v,weight:Number(e.target.value)}:v))}/>
                    <button type="button" className="goalStageRemove" aria-label={t("removeStage")}
                        onClick={()=>setStages(old=>old.filter((_,j)=>j!==i))}><XIcon size={20}/></button>
                </div>)}
                <button type="button" className="goalWorkspaceQuiet" onClick={()=>
                    setStages(old=>[...old,{title:"",weight:1}])}><PlusIcon size={18}/>{t("addStage")}</button>
            </div>}
            <button className="addHabitSave goalWorkspaceSubmit" type="submit"
                disabled={saving || !name.trim()}>{t(saving?"saving":"save")}</button>
        </>}
    </form>;
}
