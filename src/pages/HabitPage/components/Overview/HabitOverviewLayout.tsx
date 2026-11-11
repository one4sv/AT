import { useMemo, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { formatDateLabel, todayStrFunc } from "../../../../components/ts/utils/dateToStr";
import { makeDayEntries, describeDayTime } from "../../../../components/ts/utils/dayTimeline";
import Calendar from "../Calendar/Calendar";
import HabitOverviewEntries from "./HabitOverviewEntries";
import "../../scss/HabitOverview.scss";

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
    return <div className="overviewPanelSkeleton" role="status" aria-busy="true">
        <div className="skeletonLine skeletonTitle"/>
        {Array.from({ length: rows }, (_, index) => <div className="skeletonLine" key={index}/>)}
    </div>;
}

export default function HabitOverviewLayout() {
    const { t } = useTranslation("common");
    const { chosenDay, calendar, calendarLoading } = useCalendar();
    const { habits, loadingHabits } = useHabits();
    const { plans, loadingPlans } = usePlans();
    const { openMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const [view, setView] = useState<"all" | "activities" | "plans">("all");
    const entries = useMemo(() => makeDayEntries(chosenDay, habits, plans, calendar),
        [chosenDay, habits, plans, calendar]);
    const visible = entries.filter(entry => view === "all" || (view === "activities" ? entry.kind === "habit" : entry.kind === "plan"));
    const pending = visible.filter(entry => !entry.completed && entry.plan?.status !== "canceled");
    const nextFour = pending.slice(0, 4);
    const activityCount = entries.filter(entry => entry.kind === "habit").length;
    const planCount = entries.length - activityCount;
    const completedCount = entries.filter(entry => entry.completed).length;
    const currentTime = new Date().toTimeString().slice(0, 5);
    const ongoing = entries.filter(entry => entry.kind === "habit" && !entry.completed &&
        (entry.state === "now" || (chosenDay === todayStrFunc() && entry.start && entry.end &&
            entry.start <= currentTime && currentTime <= entry.end)));
    const current = ongoing[0];

    const showCreateMenu = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        openMenu(bounds.left, bounds.bottom + 6, "planCreate", { id: "create", name: t("plans.activitiesAndPlans") });
    };

    return <div className="habitOverview">
        <div className="habitOverviewCalendar">
            {calendarLoading ? <PanelSkeleton rows={6}/> : <Calendar/>}
        </div>
        <div className="habitOverviewCenter">
            <div className="habitOverviewHeader">
                <span>{formatDateLabel(chosenDay)}</span>
                <button className="habitOverviewAddButton" type="button"
                    data-context-menu="true" data-context-menu-allow-button="true"
                    aria-label={t("plans.createActions")} title={t("plans.createActions")}
                    onClick={showCreateMenu} onContextMenu={showCreateMenu}>
                    <PlusIcon size={21}/>
                </button>
            </div>
            {loadingHabits || calendarLoading ? <PanelSkeleton rows={4}/> : <>
                <div className="habitOverviewSummary">
                    <div><span>{activityCount}</span><small>{t("plans.activities")}</small></div>
                    <div><span>{planCount}</span><small>{t("plans.title")}</small></div>
                </div>
                <div className="habitOverviewProgress" role="progressbar" aria-valuenow={completedCount}
                    aria-valuemin={0} aria-valuemax={entries.length || 1}
                    aria-label={t("plans.completed")}>
                    <span style={{ width: entries.length ? completedCount / entries.length * 100 + "%" : "0%" }}/>
                </div>
                <p>{t("plans.completedCount", { done: completedCount, total: entries.length })}</p>
                <p>{t("plans.remainingCount", { count: entries.length - completedCount })}</p>
                {current && <div className="habitOverviewCurrent">
                    <small>{t("plans.currentActivity")}</small>
                    <span>{current.name}{ongoing.length > 1 && <b> +{ongoing.length - 1}</b>}</span>
                    <small>{describeDayTime(current, t)}</small>
                </div>}
            </>}
        </div>
        <div className="habitOverviewContext">
            <div className="habitOverviewHeader">{t("plans.daySummary")}</div>
            <div className="habitOverviewNextLabel">{t("plans.nextUp")}</div>
            <div className="habitOverviewFilters">
                <button type="button" className={view === "all" ? "active" : ""} onClick={() => setView("all")}>{t("plans.all")}</button>
                <button type="button" className={view === "activities" ? "active" : ""} onClick={() => setView("activities")}>{t("plans.activities")}</button>
                <button type="button" className={view === "plans" ? "active" : ""} onClick={() => setView("plans")}>{t("plans.title")}</button>
            </div>
            {loadingPlans || loadingHabits || calendarLoading ? <PanelSkeleton rows={4}/> :
                <div className="habitOverviewNextList">
                    <HabitOverviewEntries entries={nextFour} view={view}/>
                </div>}
            <button className="habitOverviewShowAll" type="button"
                onClick={() => setBlackout({ seted: true, module: "HabitOverviewList", options: { name: view } })}>
                {t("plans.showAll")}{!loadingPlans && pending.length > 4 ? " (" + pending.length + ")" : ""}
            </button>
        </div>
    </div>;
}
