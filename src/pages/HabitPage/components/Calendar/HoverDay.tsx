import { useEffect,useLayoutEffect,useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "../../../../components/hooks/UserHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { api } from "../../../../components/ts/api";
import { CompletionAvatars } from "../../../../components/ts/ActivityIndicators";
import useHabitDayProgress from "../../../../components/hooks/utils/useHabitDayProgress";

export interface DaySummaryProps {
    date:string;habitId?:string;completed:number;missed:number;planned:number;ongoing:number;comment?:string;
}
export function DaySummary({date,habitId,completed,missed,planned,ongoing,comment}:DaySummaryProps){
    const {t}=useTranslation("common");
    const {user}=useUser();
    const {habit}=useTheHabit();
    const member=Boolean(user.id && (!habitId || (habit && habit.id===Number(habitId) && (habit.user_id===user.id || habit.access?.is_member))));
    const progress=useHabitDayProgress(member && habitId?date:"");
    const [goals,setGoals]=useState<{id:number;name:string;percent:number|null;kind:string}[]>([]);
    const [goalCount,setGoalCount]=useState<number|null>(null);
    useEffect(()=>{
        setGoals([]);setGoalCount(null);
        if(!member)return;
        const controller=new AbortController();
        const timer=window.setTimeout(()=>{
            if(habitId)void api.get("goal-workspace/activity/"+habitId+"/day/"+date,{signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted && data.success)setGoals(data.goals || []);}).catch(()=>{});
            else void api.get("goal-workspace/day/"+date,{signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted && data.success)setGoalCount(data.completed_ids?.length || 0);}).catch(()=>{});
        },120);
        return ()=>{clearTimeout(timer);controller.abort();};
    },[date,habitId,member,user.id]);
    const shared=habitId?progress[habitId]:undefined;
    return <>
        {!habitId ? <>
            {[[ongoing,"now","ongoing"],[completed,"comp","completed"],[missed,"skip","missed"],[planned,"will","planned"]].map(([count,cl,key])=>Number(count)>0 && <div className="hoverRow" key={String(key)}><div className={"calendarDot "+cl}/>{t("calendarDay."+key)}: {count}</div>)}
            {!ongoing && !completed && !missed && !planned && <div className="hoverRow hrEmpty">{t("calendarDay.empty")}</div>}
            {goalCount!=null && <div className="hoverRow">{t("calendarDay.goalsCompleted")}: {goalCount}</div>}
        </>:<>
            {shared && (shared.actor_count ?? shared.actors?.length ?? 0)>0 && (shared.total>1 || habit?.chat_id) && <div className="hoverRow">{t("calendarDay.completedBy")} <CompletionAvatars progress={shared}/></div>}
            <div className={"hoverRow"+(!comment?" hrEmpty":"")}>{comment || t("calendarDay.noComment")}</div>
            {goals.map(goal=><div key={goal.id} className="hoverGoalRow">
                <div className="hoverRow"><span>{goal.name}</span><strong>{goal.percent==null?"—":(goal.kind==="change" && goal.percent>0?"+":"")+goal.percent+"%"}</strong></div>
                <div className="hoverGoalTrack"><span style={{width:Math.max(0,Math.min(100,goal.percent || 0))+"%"}}/></div>
                <small>{t(goal.kind==="change"?"calendarDay.goalChange":"calendarDay.goalDaily")}</small>
            </div>)}
        </>}
    </>;
}
export default function HoverDay(props:DaySummaryProps & {targetRef:React.RefObject<HTMLDivElement|null>}){
    const [position,setPosition]=useState<{top:number;left:number}|null>(null);
    useLayoutEffect(()=>{
        const update=()=>{const rect=props.targetRef.current?.getBoundingClientRect();if(rect)setPosition({top:Math.max(8,Math.min(rect.top,window.innerHeight-180)),left:Math.max(8,Math.min(rect.right+8,window.innerWidth-250))});};
        update();window.addEventListener("scroll",update,true);window.addEventListener("resize",update);
        return ()=>{window.removeEventListener("scroll",update,true);window.removeEventListener("resize",update);};
    },[props.targetRef]);
    return position?createPortal(<div className="hoverDayDiv" style={{top:position.top,left:position.left}}><DaySummary {...props}/></div>,document.body):null;
}
