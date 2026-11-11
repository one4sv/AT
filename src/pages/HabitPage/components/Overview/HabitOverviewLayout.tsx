import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, CircleIcon, PlusIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useDone } from "../../../../components/hooks/DoneHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook";
import { formatDateLabel } from "../../../../components/ts/utils/dateToStr";
import { makeDayEntries, describeDayTime, type DayEntry } from "../../../../components/ts/utils/dayTimeline";
import { api } from "../../../../components/ts/api";
import SectionArt from "../../../../components/ts/SectionArt";
import Selector from "../../../../components/ts/Selector";
import Calendar from "../Calendar/Calendar";
import "../../scss/HabitOverview.scss";

export default function HabitOverviewLayout() {
    const { t } = useTranslation("common");
    const { chosenDay, calendar } = useCalendar();
    const { habits } = useHabits();
    const { markDone } = useDone();
    const { plans, refreshPlans, loadingPlans } = usePlans();
    const { openMenu } = useContextMenu();
    const navigate = useNavigate();
    const [view, setView] = useState<"all" | "activities" | "plans">("all");
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        void refreshPlans().catch(() => {});
    }, [refreshPlans]);

    const entries = useMemo(
        () => makeDayEntries(chosenDay, habits, plans, calendar),
        [chosenDay, habits, plans, calendar]
    );
    const visible = entries.filter(entry =>
        view === "all" || (view === "activities" ? entry.kind === "habit" : entry.kind === "plan")
    );
    const selected = entries.find(entry => entry.key === selectedKey);
    const activityCount = entries.filter(entry => entry.kind === "habit").length;
    const planCount = entries.length - activityCount;
    const completedCount = entries.filter(entry => entry.completed).length;
    const pendingCount = entries.length - completedCount;
    const now = new Date();
    const nowClock = now.toTimeString().slice(0, 5);
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")].join("-");
    const next = entries.find(entry => !entry.completed &&
        (chosenDay !== today || !entry.start || entry.start >= nowClock)
    ) || entries.find(entry => !entry.completed);

    const open = (entry: DayEntry) => {
        if (isMobile) navigate(entry.kind === "plan" ? "/plan/" + entry.plan!.id : "/habit/" + entry.habit!.id);
        else setSelectedKey(entry.key);
    };
    const openDetail = (entry: DayEntry) => navigate(
        entry.kind === "plan" ? "/plan/" + entry.plan!.id : "/habit/" + entry.habit!.id
    );
    const complete = async (entry: DayEntry) => {
        if (updating || (entry.kind === "plan" && entry.plan?.status === "canceled")) return;
        if (entry.kind === "habit") {
            void markDone(entry.habit!.id, chosenDay);
            return;
        }
        if (entry.plan?.membership_status !== "accepted" ||
            (entry.plan?.completion_mode === "shared" && !entry.plan?.is_owner)) return;
        setUpdating(entry.key);
        try {
            const response = await api.post("plans/" + entry.plan!.id + "/complete", {
                completed: !entry.completed
            });
            if (response.data?.success) await refreshPlans();
        } catch (error) {
            console.error("Failed to complete plan", error);
        } finally {
            setUpdating(null);
        }
    };
    const showCreateMenu = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        openMenu(bounds.left, bounds.bottom + 6, "planCreate", { id: "create", name: t("plans.activitiesAndPlans") });
    };

    return <div className="habitOverview">
        <div className="habitOverviewCalendar"><Calendar/></div>
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
            <Selector selected={view} arr={[
                { value: "all", label: t("plans.all"), func: setView },
                { value: "activities", label: t("plans.activities"), func: setView },
                { value: "plans", label: t("plans.title"), func: setView }
            ]}/>
            <div className="habitOverviewBody">
                {plans.some(plan => plan.membership_status === "pending") && <div className="habitOverviewInvitations">
                    <span>{t("plans.invitations")}</span>
                    {plans.filter(plan => plan.membership_status === "pending").map(plan =>
                        <button key={plan.id} type="button" className="habitOverviewPlan"
                            onClick={() => navigate("/plan/" + plan.id)}>
                            {plan.name} · {t("plans.accept")}
                        </button>
                    )}
                </div>}
                <div className="habitOverviewTimeline">
                    {loadingPlans ? <p className="habitOverviewEmptyText">{t("plans.loading")}</p> :
                        visible.length ? visible.map(entry => <div className="habitOverviewEntry" key={entry.key}>
                            <button className="habitOverviewEntryMain" type="button"
                                onClick={() => open(entry)} aria-pressed={selectedKey === entry.key}>
                                <span className={"calendarDot " + (entry.kind === "plan" ? "plan" : entry.state)}/>
                                <span className="habitOverviewEntryInfo">
                                    <span className="habitOverviewEntryName">{entry.name}</span>
                                    <small>{describeDayTime(entry, t)}</small>
                                </span>
                            </button>
                            {entry.kind === "habit" ?
                                <button type="button" className="habitOverviewEntryDone"
                                    aria-label={t(entry.completed ? "plans.undoCompletion" : "plans.markCompleted")}
                                    onClick={() => void complete(entry)}>
                                    {entry.completed ? <CheckCircleIcon weight="fill" size={20}/> : <CircleIcon size={20}/>}
                                </button> :
                                entry.plan?.membership_status === "accepted" &&
                                (entry.plan?.completion_mode !== "shared" || entry.plan?.is_owner) &&
                                entry.plan?.status !== "canceled" &&
                                <button type="button" className="habitOverviewEntryDone"
                                    disabled={Boolean(updating)}
                                    aria-label={t(entry.completed ? "plans.undoCompletion" : "plans.markCompleted")}
                                    onClick={() => void complete(entry)}>
                                    {entry.completed ? <CheckCircleIcon weight="fill" size={20}/> : <CircleIcon size={20}/>}
                                </button>}
                        </div>) : <div className="habitOverviewEmpty">
                            <SectionArt theme="plans" mini/>
                            <p>{t(view === "plans" ? "plans.emptyDay" : "plans.emptyTimeline")}</p>
                        </div>}
                </div>
            </div>
        </div>
        <div className="habitOverviewContext">
            {selected ? <>
                <div className="habitOverviewHeader">{selected.name}</div>
                <small>{t(selected.kind === "plan" ? "plans.title" : "plans.activities")}</small>
                <p>{describeDayTime(selected, t)}</p>
                {selected.description && <p>{selected.description}</p>}
                <p>{t(selected.completed ? "plans.completed" : "plans.upcoming")}</p>
                <button type="button" className="planPrimaryButton" onClick={() => openDetail(selected)}>
                    {t("plans.open")}
                </button>
                <button type="button" className="planQuietButton" onClick={() => setSelectedKey(null)}>
                    {t("plans.daySummary")}
                </button>
            </> : <>
                <div className="habitOverviewHeader">{t("plans.daySummary")}</div>
                <div className="habitOverviewSummary">
                    <div><span>{activityCount}</span><small>{t("plans.activities")}</small></div>
                    <div><span>{planCount}</span><small>{t("plans.title")}</small></div>
                </div>
                <div className="habitOverviewProgress" role="progressbar"
                    aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={entries.length || 1}
                    aria-label={t("plans.completed")}>
                    <span style={{ width: entries.length ? completedCount / entries.length * 100 + "%" : "0%" }}/>
                </div>
                <p>{t("plans.completedCount", { done: completedCount, total: entries.length })}</p>
                <p>{t("plans.remainingCount", { count: pendingCount })}</p>
                {next && <button className="habitOverviewNext" type="button" onClick={() => open(next)}>
                    <small>{t("plans.nextUp")}</small>
                    <span>{next.name}</span>
                    <small>{describeDayTime(next, t)}</small>
                </button>}
            </>}
        </div>
    </div>;
}
