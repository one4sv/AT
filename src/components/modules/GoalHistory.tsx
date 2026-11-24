import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { api } from "../ts/api";
import type { Goal,GoalPeriod } from "../../pages/HabitPage/components/Overview/goalTypes";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "./scss/goalWorkspace.scss";

export default function GoalHistory() {
    const {t}=useTranslation("goals");
    const {blackout}=useBlackout();
    const idRef=useRef(blackout.options?.id);
    if(blackout.module==="GoalHistory" && blackout.options?.id) idRef.current=blackout.options.id;
    const id=idRef.current;
    const [goal,setGoal]=useState<Goal | null>(null);
    const [periods,setPeriods]=useState<GoalPeriod[]>([]);
    const [periodsLoading,setPeriodsLoading]=useState(false);
    const [hasMore,setHasMore]=useState(false);
    const [periodError,setPeriodError]=useState(false);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(false);
    useEffect(()=>{
        let active=true;
        setLoading(true);
        setError(false);
        setGoal(null);
        setPeriods([]);setHasMore(false);setPeriodError(false);
        void api.get<{success:boolean;goal:Goal}>("goal-workspace/"+id).then(({data})=>{
            if(!data.success) throw new Error("Goal history unavailable");
            if(active) setGoal(data.goal);
        }).catch(()=>{if(active) setError(true);}).finally(()=>{if(active) setLoading(false);});
        void api.get<{success:boolean;periods:GoalPeriod[]}>("goal-workspace/"+id+"/periods").then(({data})=>{
            if(!data.success)throw new Error("Period history unavailable");
            if(active){setPeriods(data.periods);setHasMore(data.periods.length===50);}
        }).catch(()=>{if(active)setPeriodError(true);});
        return ()=>{active=false;};
    },[id]);
    const loadMore=async()=>{
        if(periodsLoading || !periods.length)return;
        setPeriodsLoading(true);
        try{
            const {data}=await api.get<{success:boolean;periods:GoalPeriod[]}>("goal-workspace/"+id+"/periods",{params:{before:periods[periods.length-1].id}});
            if(!data.success)throw new Error("Period history unavailable");
            setPeriods(old=>[...old,...data.periods]);setHasMore(data.periods.length===50);setPeriodError(false);
        }catch{setPeriodError(true);}finally{setPeriodsLoading(false);}
    };
    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal goalHistory">
        <h2>{t("history")}</h2>
        {loading ? <span>{t("loading")}</span> : error || !goal ? <span>{t("loadError")}</span> : <>
            <div className="goalWorkspaceMeta">{goal.name}</div>
            {(periods.length>0 || (goal.repeat_frequency && goal.repeat_frequency!=="none")) && <>
                <h3>{t("periodHistory")}</h3>
                <div className="goalWorkspaceEvents">
                    {periods.length ? periods.map(period=><div key={period.id}>
                        <span>{period.period_start} — {period.period_end}</span>
                        <span>{t(period.completed?"periodCompleted":"periodMissed")} · {period.progress}%</span>
                    </div>) : <span>{t("noPeriods")}</span>}
                </div>
                {hasMore && <button type="button" className="goalWorkspaceQuiet" disabled={periodsLoading} onClick={()=>void loadMore()}>{t("loadMorePeriods")}</button>}
            </>}
            {periodError && <small>{t("loadError")}</small>}
            <div className="goalWorkspaceEvents">
                {goal.events?.length ? goal.events.map(e=><div key={e.id}>
                    <span>{e.action==="progress_changed"?t("historyProgress",{from:e.details?.from ?? "—",to:e.details?.to}):e.action==="period_closed"?t("periodClosed",{progress:e.details?.progress ?? 0}):t("event."+e.action,{defaultValue:e.action})}</span>
                    <time dateTime={e.created_at}>{new Date(e.created_at).toLocaleString()}</time>
                </div>) : <span>—</span>}
            </div>
        </>}
    </div>;
}
