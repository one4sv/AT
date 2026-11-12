import { isMobile } from "react-device-detect";
import type { Habit } from "../../../components/context/HabitsContext";
import type { PrivateSettings } from "../../../components/context/SettingsContext";
import HabitDiv from "../../../components/ts/Habit";
import { useTranslation } from "react-i18next";
import SectionArt from "../../../components/ts/SectionArt";
import PlanDiv from "../../../components/ts/Plan";
import type { OneOffPlan } from "../../../components/context/PlansContext";
import type { DayEntry } from "../../../components/ts/utils/dayTimeline";

interface acchabitsProps {
    habits?:Habit[],
    plans?:OneOffPlan[],
    canView?:(field: keyof PrivateSettings) => boolean,
    isMyAcc?:boolean,
}
export default function AccHabits({habits, plans, canView, isMyAcc}:acchabitsProps) {
    const { t } = useTranslation("acc");
    const isPrivate = !!canView && !canView("habits");
    const isEmpty = (!habits?.length || isPrivate) && !plans?.length;
    return (
        <div className="accHabits">
            <div className="accHabitsInfo">
                <div className="accHabitChart"></div>
                <div className="accHabitOverall"></div>
            </div>
            <div className={`accHabitsList ${isMobile ? "mobile" : ""} ${isEmpty ? "empty" : ""}`}>
                {!isPrivate && habits?.map((habit: Habit) =>
                    <HabitDiv key={habit.id} habit={habit} isMyAcc={isMyAcc}/>)}
                {plans?.map(plan => {
                    const entry: DayEntry = {
                        key:"plan-" + plan.id,kind:"plan",name:plan.name,
                        date:plan.plan_date,start:plan.start_time?.slice(0,5) || null,
                        end:plan.end_time?.slice(0,5) || null,description:plan.description || "",
                        completed:false,state:"will",plan
                    };
                    return <PlanDiv key={entry.key} plan={plan} entry={entry}/>;
                })}
                {isEmpty && <div className="accEmptyState">
                    <SectionArt theme={isPrivate ? "privacy" : "habits"}/>
                    <span>{isPrivate ? t("activitiesHidden") : t(isMyAcc ? "activitiesEmptyOwn" : "activitiesEmpty")}</span>
                </div>}
            </div>
        </div>
    )
}