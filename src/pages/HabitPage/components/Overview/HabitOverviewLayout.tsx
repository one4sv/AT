import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, PlusIcon, PushPinIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../components/hooks/UserHook";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { clockInAppZone, formatDateLabel, todayStrFunc } from "../../../../components/ts/utils/dateToStr";
import { makeDayEntries, describeEntrySubtitle, type DayEntry } from "../../../../components/ts/utils/dayTimeline";
import ActivityIndicators, { type HabitDayProgress } from "../../../../components/ts/ActivityIndicators";
import useHabitDayProgress from "../../../../components/hooks/utils/useHabitDayProgress";
import { getOverviewFocus, getOverviewNext } from "./dayFocus";
import Calendar from "../Calendar/Calendar";
import HabitOverviewEntries, { OverviewEntryTag } from "./HabitOverviewEntries";
import { useGoalsWorkspace } from "../../../../components/hooks/useGoalsWorkspace";
import useGoalDayResults from "../../../../components/hooks/useGoalDayResults";
import DayGoalEntries,{goalsForDay} from "./DayGoalEntries";
import "./goalLocale";
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
    </div>;
}

function OverviewFocusCard({ entry, label, more = 0, calendar, progress }: {
    entry: DayEntry; label: string; more?: number;
    calendar: ReturnType<typeof useCalendar>["calendar"];
    progress?: HabitDayProgress;
}) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();

    return <div className="habitOverviewFocusGroup">
        <small className="habitOverviewFocusLabel">{label}</small>
        <button type="button" className="habitOverviewCurrent"
            onClick={() => navigate(entry.kind === "plan" ? `/plan/${entry.plan!.id}` : `/habit/${entry.habit!.id}`)}>
            <div className="habitOverviewCurrentRow">
                <OverviewEntryTag entry={entry}/>
                <div className="habitOverviewCurrentDetails">
                    <span className="habitOverviewCurrentTitle">
                        <span className="activityName">{entry.name}{more > 0 && <b> +{more}</b>}</span>
                        <ActivityIndicators part="streak" habit={entry.habit} plan={entry.plan} calendar={calendar}/>
                        {entry.habit?.pinned && <PushPinIcon className="pinnedHabitSign" weight="fill" size={14}/>}
                        <ActivityIndicators part="aside" habit={entry.habit} progress={progress}/>
                    </span>
                    <span className="habitOverviewCurrentMeta">
                        <small>{describeEntrySubtitle(entry, t)}</small>
                        {entry.completed && <CheckCircleIcon className="habitOverviewMetaDone" weight="fill" size={18}/>}
                    </span>
                </div>
            </div>
        </button>
    </div>;
}

export default function HabitOverviewLayout({ feed = false }: { feed?: boolean } = {}) {
    const { t } = useTranslation("common");
    const { t: tGoals } = useTranslation("goals");
    const { user } = useUser();
    const { goals, loading: loadingGoals, error: goalsError } = useGoalsWorkspace(!feed);
    const { chosenDay: calendarDay, calendar: activeCalendar, allCalendar, calendarLoading: activeCalendarLoading, allCalendarLoading } = useCalendar();
    const chosenDay = feed ? todayStrFunc() : calendarDay;
    const calendar = feed ? allCalendar : activeCalendar;
    const calendarLoading = feed ? allCalendarLoading : activeCalendarLoading;
    const [, setClockTick] = useState(0);
    useEffect(() => {
        if (!feed) return;
        const refresh = () => setClockTick(value => value + 1);
        const tick = window.setInterval(refresh, 15000);
        window.addEventListener("focus", refresh);
        return () => { window.clearInterval(tick); window.removeEventListener("focus", refresh); };
    }, [feed]);
    const { habits, loadingHabits } = useHabits();
    const { plans, loadingPlans } = usePlans();
    const { openMenu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const dayProgress = useHabitDayProgress(chosenDay);
    const [view, setView] = useState<"all" | "activities" | "plans" | "goals">("all");
    const goalDay=useGoalDayResults(chosenDay,goals,Boolean(user.id) && !feed);
    const dayGoals=goalsForDay(goals,chosenDay,goalDay.ids);
    const [initializedAccount, setInitializedAccount] = useState<string | null>(null);
    const initializing = initializedAccount !== user.id;
    useEffect(() => {
        if (user.id && !loadingHabits && !loadingPlans && !calendarLoading) setInitializedAccount(user.id);
    }, [user.id, loadingHabits, loadingPlans, calendarLoading]);
    const entries = useMemo(() => makeDayEntries(chosenDay, habits, plans, calendar),
        [chosenDay, habits, plans, calendar]);
    const visible = entries.filter(entry => view === "all" || (view === "activities" && entry.kind === "habit") || (view === "plans" && entry.kind === "plan"));
    const pending = visible.filter(entry => !entry.completed && entry.plan?.status !== "canceled");
    const nextFour = pending.slice(0, 4);
    const activityCount = entries.filter(entry => entry.kind === "habit").length;
    const planCount = entries.length - activityCount;
    const goalCount = dayGoals.length;
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

    return <div className={"habitOverview" + (feed ? " habitOverviewFeed" : "")}>
        {!feed && <div className="habitOverviewCalendar">
            {calendarLoading ? <CalendarSkeleton/> : <Calendar/>}
        </div>}
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
            {initializing ? <SummarySkeleton/> : <>
                {(activityCount > 0 || planCount > 0 || (!feed && !goalsError && goalCount > 0)) && <div className="habitOverviewSummary">
                    {activityCount > 0 && <button type="button"
                        onClick={() => setBlackout({ seted: true, module: "HabitOverviewList", options: { name: "activities", ...(feed ? { day: chosenDay, hideGoals: true } : {}) } })}>
                        <span>{activityCount}</span><small>{t("plans.activities")}</small>
                    </button>}
                    {planCount > 0 && <button type="button"
                        onClick={() => setBlackout({ seted: true, module: "HabitOverviewList", options: { name: "plans", ...(feed ? { day: chosenDay, hideGoals: true } : {}) } })}>
                        <span>{planCount}</span><small>{t("plans.title")}</small>
                    </button>}
                    {!feed && !goalsError && goalCount > 0 && <button type="button"
                        onClick={() => setBlackout({ seted: true, module: "HabitOverviewList", options: { name: "goals" } })}>
                        <span>{goalCount}</span><small>{tGoals("title")}</small>
                    </button>}
                </div>}
                {!feed && chosenDay >= todayStrFunc() && loadingGoals && !goalCount && <div className="skeletonLine" role="status" aria-label={tGoals("loading")}/>}
                {!feed && chosenDay >= todayStrFunc() && goalsError && <small>{tGoals("loadError")}</small>}
                <div className="habitOverviewProgress" role="progressbar" aria-valuenow={completedCount}
                    aria-valuemin={0} aria-valuemax={entries.length || 1}
                    aria-label={t("plans.completed")}>
                    <span style={{ width: entries.length ? completedCount / entries.length * 100 + "%" : "0%" }}/>
                </div>
                <p>{t("plans.completedCount", { done: completedCount, total: entries.length })}</p>
                <p>{t("plans.remainingCount", { count: entries.length - completedCount })}</p>
                {!feed && !goalDay.loading && !goalDay.error && (goalCount>0 || goalDay.ids.length>0) && <p>{tGoals(chosenDay===todayStrFunc()?"completedTodayCount":"completedDayCount",{count:goalDay.ids.length})}</p>}
                {focus && <OverviewFocusCard entry={focus.entry} more={focus.more} calendar={calendar}
                    progress={focus.entry.habit ? dayProgress[String(focus.entry.habit.id)] : undefined}
                    label={t(focus.kind === "dayStart" ? "plans.dayStart" :
                        focus.entry.kind === "plan" ? "plans.currentPlan" : "plans.currentActivity")}/>}
                {nextEntry && <OverviewFocusCard entry={nextEntry} calendar={calendar}
                    progress={nextEntry.habit ? dayProgress[String(nextEntry.habit.id)] : undefined}
                    label={t(nextEntry.kind === "plan" ? "plans.nextPlan" : "plans.nextActivity")}/>}
            </>}
        </div>
        {!feed && <div className="habitOverviewContext">
            <div className="habitOverviewHeader">{t("plans.daySummary")}</div>
            <div className="habitOverviewNextLabel">{view==="goals"?tGoals("title"):t("plans.nextUp")}</div>
            {initializing ? <UpcomingSkeleton/> : <>
                <div className="habitOverviewFilters">
                    <button type="button" className={view === "all" ? "active" : ""} onClick={() => setView("all")}>{t("plans.all")}</button>
                    <button type="button" className={view === "activities" ? "active" : ""} onClick={() => setView("activities")}>{t("plans.activities")}</button>
                    <button type="button" className={view === "plans" ? "active" : ""} onClick={() => setView("plans")}>{t("plans.title")}</button>
                    <button type="button" className={view === "goals" ? "active" : ""} onClick={() => setView("goals")}>{tGoals("title")}</button>
                </div>
                <div className="habitOverviewNextList">
                    {view!=="goals" && <HabitOverviewEntries entries={nextFour} view={view}/>}
                    {view==="goals" && <DayGoalEntries goals={dayGoals} ids={goalDay.ids} day={chosenDay} loading={loadingGoals || goalDay.loading} error={goalsError || goalDay.error}/>}
                </div>
            </>}
        </div>}
    </div>;
}
