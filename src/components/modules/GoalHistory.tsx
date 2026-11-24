import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { api } from "../ts/api";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "./scss/goalWorkspace.scss";

export default function GoalHistory() {
    const {t}=useTranslation("goals");
    const {blackout}=useBlackout();
    const idRef=useRef(blackout.options?.id);
    if(blackout.module==="GoalHistory" && blackout.options?.id) idRef.current=blackout.options.id;
    const id=idRef.current;
    const [goal,setGoal]=useState<Goal | null>(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(false);
    useEffect(()=>{
        let active=true;
        setLoading(true);
        setError(false);
        setGoal(null);
        void api.get<{success:boolean;goal:Goal}>("goal-workspace/"+id).then(({data})=>{
            if(!data.success) throw new Error("Goal history unavailable");
            if(active) setGoal(data.goal);
        }).catch(()=>{if(active) setError(true);}).finally(()=>{if(active) setLoading(false);});
        return ()=>{active=false;};
    },[id]);
    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal goalHistory">
        <h2>{t("history")}</h2>
        {loading ? <span>{t("loading")}</span> : error || !goal ? <span>{t("loadError")}</span> : <>
            <div className="goalWorkspaceMeta">{goal.name}</div>
            <div className="goalWorkspaceEvents">
                {goal.events?.length ? goal.events.map(e=><div key={e.id}>
                    <span>{e.action==="progress_changed"?t("historyProgress",{from:e.details?.from ?? "—",to:e.details?.to}):t("event."+e.action,{defaultValue:e.action})}</span>
                    <time dateTime={e.created_at}>{new Date(e.created_at).toLocaleString()}</time>
                </div>) : <span>—</span>}
            </div>
        </>}
    </div>;
}
