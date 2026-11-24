import { useTranslation } from "react-i18next";
import { TargetIcon,CheckCircleIcon } from "@phosphor-icons/react";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { goalIsCurrent,type Goal } from "./goalTypes";
import { todayStrFunc } from "../../../../components/ts/utils/dateToStr";
import "./goalLocale";

export function goalsForDay(goals:Goal[],day:string,ids:string[]) {
    return goals.filter(goal=>ids.includes(String(goal.id)) || (day>=todayStrFunc() && goalIsCurrent(goal)));
}
export default function DayGoalEntries({goals,ids,loading,error,day}: {goals:Goal[];ids:string[];loading:boolean;error:boolean;day:string}) {
    const {t}=useTranslation("goals");
    const {setBlackout}=useBlackout();
    if(loading)return <small>{t("loading")}</small>;
    if(error)return <small>{t("loadError")}</small>;
    if(!goals.length)return <small>{t("noDayGoals")}</small>;
    return <div className="habitOverviewTimeline">
        {goals.map(goal=><div className="habitOverviewEntry" key={goal.id}>
            <button type="button" className="habitOverviewEntryMain" onClick={()=>setBlackout({seted:true,module:"GoalDetails",options:{id:String(goal.id)}})}>
                <TargetIcon className="habitOverviewEntryTagIcon" size={20}/>
                <span className="habitOverviewEntryInfo">
                    <span className="habitOverviewEntryName"><span className="activityName">{goal.name}</span></span>
                    <small>{ids.includes(String(goal.id))?t(day===todayStrFunc()?"completedToday":"completedOnDay"):t("progress")+": "+goal.progress+"%"}</small>
                </span>
            </button>
            {ids.includes(String(goal.id))?<CheckCircleIcon className="habitOverviewGoalDone" weight="fill" size={20}/>:<small>{goal.progress}%</small>}
        </div>)}
    </div>;
}
