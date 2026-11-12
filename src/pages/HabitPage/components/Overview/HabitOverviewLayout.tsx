import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, PlusIcon, PushPinIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { clockInAppZone, formatDateLabel, todayStrFunc } from "../../../../components/ts/utils/dateToStr";
import { makeDayEntries, describeDayTime, type DayEntry } from "../../../../components/ts/utils/dayTimeline";
import { tags } from "../../../../components/ts/tags";
import ActivityIndicators, { type HabitDayProgress } from "../../../../components/ts/ActivityIndicators";
import useHabitDayProgress from "../../../../components/hooks/utils/useHabitDayProgress";
import { getOverviewFocus, getOverviewNext } from "./dayFocus";
import Calendar from "../Calendar/Calendar";
import HabitOverviewEntries from "./HabitOverviewEntries";
import "../../scss/HabitOverview.scss";

function CalendarSkeleton() {
    return <div className="overviewPanelSkeleton overviewCalendarSkeleton skeletonCard" role="status"
        aria-label="Загрузка календаря" aria-busy="true">
        <div className="skeletonLine skeletonTitle"/>
        <div className="skeletonWeek">{Array.from({ length: 7 }, (_, index) =>
            <span className="skeletonCircle" key={index}/>)}</div>
        <div className="skeletonDays">{Array.from({ length: 35 }, (_, index) =>
            <span className="skeletonCircle" key={index}/>)}</div>
    </div>;
}

function SummarySkeleton() {
    return <div className="overviewPanelSkeleton overviewSummarySkeleton" role="status"
        aria-label="Загрузка итогов дня" aria-busy="true">
        <div className="habitOverviewSummary">
            {[0, 1].map(index => <div className="skeletonCard" key={index}>
                <span className="skeletonLine skeletonTitle"/>
                <span className="skeletonLine skeletonShort"/>
            </div>)}
        </div>
        <span className="skeletonLine overviewSkeletonProgress"/>
        <span className="skeletonLine"/>
        <span className="skeletonLine skeletonShort"/>
        <div className="skeletonCard overviewSkeletonCurrent">
            <span className="skeletonLine skeletonShort"/>
            <span className="skeletonLine"/>
            <span className="skeletonLine skeletonShort"/>
        </div>
    </div>;
}

function UpcomingSkeleton() {
    return <div className="overviewPanelSkeleton overviewUpcomingSkeleton" role="status"
        aria-label="Загрузка ближайших дел" aria-busy="true">
        <div className="overviewSkeletonFilters">
            {[0, 1, 2].map(index => <span className="skeletonLine" key={index}/>)}
        </div>
        {[0, 1, 2, 3].map(index => <div className="skeletonCard overviewSkeletonEntry" key={index}>
            <span className="skeletonCircle"/>
            <div className="skeletonText">
                <span className="skeletonLine"/>
                <span className="skeletonLine skeletonShort"/>
            </div>
        </div>)}
        <div className="skeletonCard overviewSkeletonButton"><span className="skeletonLine"/></div>
    </div>;
}

function OverviewFocusCard({ entry, label, more = 0, calendar, progress }: {
    entry: DayEntry; label: string; more?: number;
    calendar: ReturnType<typeof useCalendar>["calendar"];
    progress?: HabitDayProgress;
}) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const tag = tags.find(item => item.value === (entry.kind === "plan" ? entry.plan?.tag : entry.habit?.tag));
    const Icon = tag?.icon;

    return <div className="habitOverviewFocusGroup">
        <small className="habitOverviewFocusLabel">{label}</small>
        <button type="button" className="habitOverviewCurrent"
            onClick={() => navigate(entry.kind === "plan" ? `/plan/${entry.plan!.id}` : `/habit/${entry.habit!.id}`)}>
            <div className="habitOverviewCurrentRow">
                {Icon && <Icon className="habitOverviewFocusIcon"/>}
                <div className="habitOverviewCurrentDetails">
                    <span className="habitOverviewCurrentTitle">
                        <span className="activityName">{entry.name}{more > 0 && <b> +{more}</b>}</span>
                        <ActivityIndicators part="streak" habit={entry.habit} calendar={calendar}/>
                        {entry.habit?.pinned && <PushPinIcon className="pinnedHabitSign" weight="fill" size={14}/>}
                        <ActivityIndicators part="aside" habit={entry.habit} plan={entry.plan} progress={progress}/>
                    </span>
                    <span className="habitOverviewCurrentMeta">
                        <small>{describeDayTime(entry, t)}</small>
                        {entry.completed && <CheckCircleIcon className="habitOverviewMetaDone" weight="fill" size={18}/>}
                    </span>
                </div>
            </div>
        </button>
    </div>;
}

export default function HabitOverviewLayout() {
    const { t } = useTranslation("common");
    const { chosenDay, calendar, calendarLoading } = useCalendar();
    const { habits, loadingHabits } = useHabits();
    const { plans, loadingPlans } = usePlans();
    const { openMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const dayProgress = useHabitDayProgress(chosenDay);
    const [view, setView] = useState<"all" | "activities" | "plans">("all");
    const entries = useMemo(() => makeDayEntries(chosenDay, habits, plans, calendar),
        [chosenDay, habits, plans, calendar]);
    const visible = entries.filter(entry => view === "all" || (view === "activities" ? entry.kind === "habit" : entry.kind === "plan"));
    const pending = visible.filter(entry => !entry.completed && entry.plan?.status !== "canceled");
    const nextFour = pending.slice(0, 4);
    const activityCount = entries.filter(entry => entry.kind === "habit").length;
    const planCount = entries.length - activityCount;
    const completedCount = entries.filter(entry => entry.completed).length;
    const currentTime = clockInAppZone();
    const focus = getOverviewFocus(entries, chosenDay, todayStrFunc(), currentTime);
    const nextEntry = getOverviewNext(entries, chosenDay, todayStrFunc(), currentTime, focus);

    const showCreateMenu = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        openMenu(bounds.left, bounds.bottom + 6, "planCreate", { id: "create", name: t("plans.activitiesAndPlans") });
    };

    return <div className="habitOverview">
        <div className="habitOverviewCalendar">
            {calendarLoading ? <CalendarSkeleton/> : <Calendar/>}
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
            {loadingHabits || loadingPlans || calendarLoading ? <SummarySkeleton/> : <>
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
                {focus && <OverviewFocusCard entry={focus.entry} more={focus.more} calendar={calendar}
                    progress={focus.entry.habit ? dayProgress[String(focus.entry.habit.id)] : undefined}
                    label={t(focus.kind === "dayStart" ? "plans.dayStart" :
                        focus.entry.kind === "plan" ? "plans.currentPlan" : "plans.currentActivity")}/>}
                {nextEntry && <OverviewFocusCard entry={nextEntry} calendar={calendar}
                    progress={nextEntry.habit ? dayProgress[String(nextEntry.habit.id)] : undefined}
                    label={t(nextEntry.kind === "plan" ? "plans.nextPlan" : "plans.nextActivity")}/>}
            </>}
        </div>
        <div className="habitOverviewContext">
            <div className="habitOverviewHeader">{t("plans.daySummary")}</div>
            <div className="habitOverviewNextLabel">{t("plans.nextUp")}</div>
            {loadingPlans || loadingHabits || calendarLoading ? <UpcomingSkeleton/> : <>
                <div className="habitOverviewFilters">
                    <button type="button" className={view === "all" ? "active" : ""} onClick={() => setView("all")}>{t("plans.all")}</button>
                    <button type="button" className={view === "activities" ? "active" : ""} onClick={() => setView("activities")}>{t("plans.activities")}</button>
                    <button type="button" className={view === "plans" ? "active" : ""} onClick={() => setView("plans")}>{t("plans.title")}</button>
                </div>
                <div className="habitOverviewNextList">
                    <HabitOverviewEntries entries={nextFour} view={view}/>
                </div>
                <button className="habitOverviewShowAll" type="button"
                    onClick={() => setBlackout({ seted: true, module: "HabitOverviewList", options: { name: view } })}>
                    {t("plans.showAll")}{pending.length > 4 ? " (" + pending.length + ")" : ""}
                </button>
            </>}
        </div>
    </div>;
}
