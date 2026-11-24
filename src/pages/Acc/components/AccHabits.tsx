import { isMobile } from "react-device-detect";
import type { Habit } from "../../../components/context/HabitsContext";
import type { PrivateSettings } from "../../../components/context/SettingsContext";
import HabitDiv from "../../../components/ts/Habit";
import { useTranslation } from "react-i18next";
import SectionArt from "../../../components/ts/SectionArt";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useGoalsWorkspace } from "../../../components/hooks/useGoalsWorkspace";
import { useUser } from "../../../components/hooks/UserHook";
import { upcomingProfilePlans } from "../../../components/ts/utils/dayTimeline";
import "../../HabitPage/components/Overview/goalLocale";
import type { OneOffPlan } from "../../../components/context/PlansContext";


interface acchabitsProps {
    habits?:Habit[],
    plans?:OneOffPlan[],
    canView?:(field: keyof PrivateSettings) => boolean,
    isMyAcc?:boolean,
    nick?:string | null,
}
export default function AccHabits({habits, plans, canView, isMyAcc, nick}:acchabitsProps) {
    const { t } = useTranslation("acc");
    const { t: tCommon } = useTranslation("common");
    const { t: tGoals } = useTranslation("goals");
    const { setBlackout } = useBlackout();
    const { user } = useUser();
    const own = !!nick && nick === user.nick;
    const { goals } = useGoalsWorkspace(own);
    const upcomingPlans = upcomingProfilePlans(plans || []);
    const isPrivate = !!canView && !canView("habits");
    const isEmpty = (!habits?.length || isPrivate) && !upcomingPlans.length && !goals.length;
    return (
        <div className="accHabits">
            <div className="accHabitsInfo">
                <div className="accHabitChart"></div>
                <div className="accHabitOverall"></div>
            </div>
            {(upcomingPlans.length > 0 || goals.length > 0) && <div className="accHabitsSummary">
                {upcomingPlans.length > 0 && <button type="button" className="accHabitsList"
                    onClick={() => setBlackout({ seted: true, module: "HabitOverviewList", options: { name: "plans", nick: nick || undefined } })}>
                    <span>{upcomingPlans.length}</span><small>{tCommon("plans.title")}</small>
                </button>}
                {goals.length > 0 && <button type="button" className="accHabitsList"
                    onClick={() => setBlackout({ seted: true, module: "GoalCatalog", options: { nick: nick || undefined } })}>
                    <span>{goals.length}</span><small>{tGoals("title")}</small>
                </button>}
            </div>}
            {(!isPrivate && !!habits?.length || isEmpty) && <div className={`accHabitsList ${isMobile ? "mobile" : ""} ${isEmpty ? "empty" : ""}`}>
                {!isPrivate && habits?.map((habit: Habit) =>
                    <HabitDiv key={habit.id} habit={habit} isMyAcc={isMyAcc}/>)}
                {isEmpty && <div className="accEmptyState">
                    <SectionArt theme={isPrivate ? "privacy" : "habits"}/>
                    <span>{isPrivate ? t("activitiesHidden") : t(isMyAcc ? "activitiesEmptyOwn" : "activitiesEmpty")}</span>
                </div>}
            </div>}
        </div>
    )
}