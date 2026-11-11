import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";
import { PlusIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook";
import { formatDateLabel } from "../../../../components/ts/utils/dateToStr";
import SectionArt from "../../../../components/ts/SectionArt";
import Selector from "../../../../components/ts/Selector";
import Calendar from "../Calendar/Calendar";
import ChosenDay from "../Calendar/ChosenDay";
import type { OneOffPlan } from "../../../../components/context/PlansContext";
import "../../scss/HabitOverview.scss";

export default function HabitOverviewLayout() {
    const { t } = useTranslation("common");
    const { chosenDay } = useCalendar();
    const { plans, refreshPlans, loadingPlans } = usePlans();
    const { openMenu } = useContextMenu();
    const navigate = useNavigate();
    const [view, setView] = useState<"all" | "activities" | "plans">("all");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        void refreshPlans().catch(() => {});
    }, [refreshPlans]);

    const dayPlans = useMemo(() => plans.filter(plan =>
        plan.plan_date === chosenDay && plan.membership_status !== "pending"
    ), [plans, chosenDay]);
    const pendingPlans = plans.filter(plan => plan.membership_status === "pending");
    const selectedPlan: OneOffPlan | undefined = dayPlans.find(plan => plan.id === selectedId);
    const open = (plan: OneOffPlan) => {
        if (isMobile) navigate("/plan/" + plan.id);
        else setSelectedId(plan.id);
    };
    const showCreateMenu = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const bounds = event.currentTarget.getBoundingClientRect();
        openMenu(bounds.left, bounds.bottom + 6, "planCreate", { id: "create", name: t("plans.activitiesAndPlans") });
    };

    const list = <div className="habitOverviewPlanList">
        {loadingPlans ? <p className="habitOverviewEmptyText">{t("plans.loading")}</p> : dayPlans.length ? dayPlans.map(plan =>
            <button type="button" className={"habitOverviewPlan " + (selectedId === plan.id ? "chosen" : "")}
                key={plan.id} onClick={() => open(plan)}>
                <span className="habitOverviewPlanName">{plan.name}</span>
                <span className="habitOverviewPlanTime">{plan.start_time?.slice(0, 5) || t("plans.noTime")}</span>
                {plan.completed_for_me && <span>{t("plans.completed")}</span>}
            </button>
        ) : <div className="habitOverviewEmpty">
            <SectionArt theme="plans" mini/>
            <p>{t("plans.emptyDay")}</p>
        </div>}
    </div>;

    return <div className="habitOverview">
        <div className="habitOverviewCalendar"><Calendar /></div>
        <div className="habitOverviewCenter">
            <div className="habitOverviewHeader">
                <span>{formatDateLabel(chosenDay)}</span>
                <button className="habitOverviewAddButton" type="button"
                    data-context-menu="true" data-context-menu-allow-button="true"
                    aria-label={t("plans.createActions")} title={t("plans.createActions")}
                    onClick={showCreateMenu}
                    onContextMenu={showCreateMenu}>
                    <PlusIcon size={21}/>
                </button>
            </div>
            <Selector selected={view} arr={[
                { value: "all", label: t("plans.all"), func: setView },
                { value: "activities", label: t("plans.activities"), func: setView },
                { value: "plans", label: t("plans.title"), func: setView }
            ]}/>
            <div className="habitOverviewBody">
                {pendingPlans.length > 0 && <div className="habitOverviewInvitations">
                    <span>{t("plans.invitations")}</span>
                    {pendingPlans.map(plan => <button key={plan.id} type="button" className="habitOverviewPlan"
                        onClick={() => navigate("/plan/" + plan.id)}>
                        <span className="habitOverviewPlanName">{plan.name}</span>
                        <span>{t("plans.accept")}</span>
                    </button>)}
                </div>}
                {(view === "all" || view === "activities") && <div className="habitOverviewActivities">
                    <ChosenDay showDate={false}/>
                </div>}
                {(view === "all" || view === "plans") && list}
            </div>
        </div>
        <div className="habitOverviewContext">
            {selectedPlan ? <>
                <div className="habitOverviewHeader">{selectedPlan.name}</div>
                <p>{selectedPlan.description || t("plans.noDescription")}</p>
                <p>{selectedPlan.start_time?.slice(0, 5) || t("plans.noTime")}</p>
                <button type="button" className="planPrimaryButton"
                    onClick={() => navigate("/plan/" + selectedPlan.id)}>{t("plans.open")}</button>
            </> : <>
                <div className="habitOverviewHeader">{t("plans.dayOverview")}</div>
                <p>{t("plans.dayCount", { count: dayPlans.length })}</p>
                <button type="button" className="planQuietButton" onClick={() => setView("plans")}>
                    {t("plans.title")}
                </button>
            </>}
        </div>
    </div>;
}
