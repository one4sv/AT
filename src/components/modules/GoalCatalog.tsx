import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TargetIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useGoalsWorkspace } from "../hooks/useGoalsWorkspace";
import "../../pages/HabitPage/components/Overview/goalLocale";
import "./scss/goalWorkspace.scss";

export default function GoalCatalog() {
    const {t}=useTranslation("goals");
    const {setBlackout}=useBlackout();
    const {goals,loading,error}=useGoalsWorkspace();
    const [status,setStatus]=useState("all");
    const filtered = status==="all" ? goals : goals.filter(goal=>status==="active" ?
        goal.status==="active" || goal.status==="paused" : goal.status===status);
    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal goalCatalog">
        <div className="goalWorkspaceHeading">
            <h2>{t("title")}</h2>
        </div>
        <div className="goalCatalogFilters">
            {["active","completed","archived","all"].map(key=><button type="button" key={key}
                className={status===key?"active":""} onClick={()=>setStatus(key)}>
                {t(key==="all"?"all":"status."+key)}
            </button>)}
        </div>
        {loading ? <span>{t("loading")}</span> : error ? <span>{t("loadError")}</span> :
            !filtered.length ? <span className="goalWorkspaceEmpty">{t("empty")}</span> :
            <div className="goalCatalogList">{filtered.map(goal=><button type="button" key={goal.id}
                className="goalCatalogItem" onClick={()=>
                    setBlackout({seted:true,module:"GoalDetails",options:{id:String(goal.id)}})}>
                <TargetIcon size={20}/>
                <span className="goalCatalogName">{goal.name}</span>
                <span className="goalCatalogProgress">{goal.progress}%</span>
                <span className="goalOverviewProgress"><span style={{width:goal.progress+"%"}}/></span>
            </button>)}</div>}
    </div>;
}
