import { useState } from "react";
import { useAcc } from "../../components/hooks/AccHook";
import { useTranslation } from "react-i18next";
import { useCalendar } from "../../components/hooks/CalendarHook";
import { useHabits } from "../../components/hooks/HabitsHook";
import { usePlans } from "../../components/hooks/PlansHook";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { makeDayEntries, makeProfilePlanEntries } from "../../components/ts/utils/dayTimeline";
import { formatDateLabel } from "../../components/ts/utils/dateToStr";
import Selector from "../../components/ts/Selector";
import HabitOverviewEntries from "../../pages/HabitPage/components/Overview/HabitOverviewEntries";
import "../../pages/HabitPage/scss/HabitOverview.scss";

export default function HabitOverviewList() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const { chosenDay, calendar, calendarLoading } = useCalendar();
    const { habits, loadingHabits } = useHabits();
    const { plans, loadingPlans } = usePlans();
    const { acc, plans: profilePlans, loading: profileLoading } = useAcc();
    const profileNick = blackout.options?.nick;
    const profileMode = !!profileNick;
    const initialView = blackout.options?.name;
    const [view, setView] = useState<"all" | "activities" | "plans">(
        initialView === "activities" || initialView === "plans" ? initialView : "all"
    );
    const all = profileMode ? (acc?.nick === profileNick ? makeProfilePlanEntries(profilePlans) : []) :
        makeDayEntries(chosenDay, habits, plans, calendar);
    const entries = all.filter(entry => view === "all" || (view === "activities" ? entry.kind === "habit" : entry.kind === "plan"));

    return <div className="habitOverviewListModal">
        <div className="habitOverviewModalHeader">
            <span>{profileMode ? t("plans.title") : formatDateLabel(chosenDay)}</span>
            <button type="button" onClick={() => setBlackout({ seted: false })} aria-label={t("plans.back")}>×</button>
        </div>
        {!profileMode && <Selector selected={view} arr={[
            { value: "all", label: t("plans.all"), func: setView },
            { value: "activities", label: t("plans.activities"), func: setView },
            { value: "plans", label: t("plans.title"), func: setView }
        ]}/> }
        <div className="habitOverviewModalBody">
            {(profileMode ? profileLoading : loadingPlans || loadingHabits || calendarLoading) ?
                <div className="overviewPanelSkeleton" aria-busy="true"><div className="skeletonLine skeletonTitle"/><div className="skeletonLine"/><div className="skeletonLine"/></div> :
                <HabitOverviewEntries entries={entries} view={profileMode ? "plans" : view} readOnly={profileMode}/>}
        </div>
    </div>;
}
