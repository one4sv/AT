import { useTranslation } from "react-i18next";
import { PlusIcon, TargetIcon } from "@phosphor-icons/react";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useGoalsWorkspace } from "../../../../components/hooks/useGoalsWorkspace";
import "./goalLocale";
import "../../scss/goalWorkspace.scss";

export default function GoalOverview() {
    const {t} = useTranslation("goals");
    const {setBlackout} = useBlackout();
    const {goals,loading,error} = useGoalsWorkspace();
    const current = goals.filter(goal=>goal.status==="active" || goal.status==="paused");
    const showDetails = (id:number) => setBlackout({seted:true,module:"GoalDetails",options:{id:String(id)}});
    return <section className="habitOverviewGoals">
        <div className="habitOverviewGoalsHeading">
            <span>{t("title")}</span>
            <button type="button" aria-label={t("create")} onClick={() => setBlackout({seted:true,module:"AddGoal"})}>
                <PlusIcon size={18}/>
            </button>
        </div>
        {loading ? <div className="goalOverviewSkeleton skeletonLine" role="status" aria-label={t("loading")}/> :
            error ? <span className="goalOverviewEmpty">{t("loadError")}</span> :
            !current.length ? <button type="button" className="goalOverviewEmpty" onClick={() =>
                setBlackout({seted:true,module:"AddGoal"})}><TargetIcon size={20}/>{t("noGoals")}</button> :
            <div className="goalOverviewList">
                {current.slice(0,4).map(goal=><button type="button" className="goalOverviewEntry" key={goal.id}
                    onClick={()=>showDetails(goal.id)}>
                    <span className="goalOverviewEntryName">{goal.name}</span>
                    <span className="goalOverviewProgress" role="progressbar" aria-valuemin={0}
                        aria-valuemax={100} aria-valuenow={goal.progress}>
                        <span style={{width:goal.progress+"%"}}/>
                    </span>
                    <small>{goal.progress}%</small>
                </button>)}
            </div>}
        {!loading && !error && !!goals.length && <button type="button" className="goalOverviewShowAll"
            onClick={() => setBlackout({seted:true,module:"GoalCatalog"})}>{t("showAll")}</button>}
    </section>;
}
