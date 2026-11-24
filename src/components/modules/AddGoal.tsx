import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { XIcon, PlusIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { goalsChanged } from "../hooks/useGoalsWorkspace";
import { api } from "../ts/api";
import CalendarInput from "../ts/CalendarInput";
import TA from "../ts/TA";
import RadioGroup from "../ts/RadioGroup";
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
            setName(goal.name);
            setDescription(goal.description || "");
            setDueDate(goal.due_date ? new Date(goal.due_date+"T12:00:00") : null);
            setMode(goal.progress_mode);
            setMetricStart(Number(goal.metric_start));
            setMetricTarget(Number(goal.metric_target));
            setUnit(goal.metric_unit || "");
            setMetricShare(Number(goal.metric_share)*100);
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
        setSaving(true);
        try{
            const payload={name:name.trim(),description,due_date:dateValue(dueDate),
                progress_mode:mode,metric_start:metricStart,metric_target:metricTarget,
                metric_unit:unit,metric_share:metricShare/100};
            const response=goalId ? await api.patch("goal-workspace/"+goalId,payload) :
                await api.post("goal-workspace",{...payload,
                    stages:stages.map(s=>({title:s.title.trim(),weight:s.weight})),
                    ...(habitId?{habit_id:Number(habitId)}:{})});
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
                <RadioGroup id="goalMode" val={mode} newVal={value=>setMode(value as GoalMode)}
                    list={(["manual","metric","milestones","combined"] as GoalMode[]).map(value=>({
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
