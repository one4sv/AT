import "../../scss/SM/habitsList.scss";
import { Link, useLocation } from "react-router-dom";
import { CheckCircleIcon, PushPinIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import type { OneOffPlan } from "../context/PlansContext";
import type { DayEntry } from "./utils/dayTimeline";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { useSideMenu } from "../hooks/SideMenuHook";
import { formatDateFromString, relativePlanDay } from "./utils/dateToStr";
import { describeDayTime } from "./utils/dayTimeline";
import ActivityIndicators from "./ActivityIndicators";
import { tags } from "./tags";
import { planAvatarUrl } from "./utils/activityImage";
import "../../scss/activityImages.scss";

function PlanTagIcon({ plan }: { plan: OneOffPlan }) {
    if(plan.avatar_key)return <div className="habitIcon"><img className="activityAvatar" loading="lazy" alt="" src={planAvatarUrl(plan.id,plan.avatar_key,plan.share)}/></div>;
    const tag=plan.tag;
    const selectedTag = tags.find(item => item.value === tag);
    if (!selectedTag) return null;
    const Icon = selectedTag.icon;
    return <div className="habitIcon"><Icon className="habitIconSvg"/></div>;
}

export default function PlanDiv({ plan, entry, onSelect }: {
    plan: OneOffPlan;
    entry: DayEntry;
    onSelect?: (plan: OneOffPlan) => void;
}) {
    const { t } = useTranslation("common");
    const { pathname } = useLocation();
    const { openMenu } = useContextMenu();
    const { closeMenu } = useSideMenu();
    const selected = pathname.replace(/\/$/, "") === "/plan/" + plan.id;
    const accepted = plan.membership_status === "accepted";
    const canComplete = plan.can_complete !== false && accepted && plan.status !== "canceled" &&
        (plan.is_owner || plan.completion_mode !== "shared");

    return <Link to={"/plan/" + plan.id + (plan.share ? "?share=" + encodeURIComponent(plan.share) : "")}
        className={`habit smPlanItem ${selected ? "active" : ""}`}
        role={onSelect ? "button" : undefined}
        aria-pressed={onSelect ? selected : undefined}
        aria-current={!onSelect && selected ? "page" : undefined}
        onKeyDown={event => {
            if (onSelect && event.key === " ") {
                event.preventDefault();
                onSelect(plan);
            }
        }}
        onClick={event => {
            if (onSelect) {
                event.preventDefault();
                onSelect(plan);
                return;
            }
            closeMenu();
        }}
        data-context-menu={onSelect ? undefined : "true"}
        onContextMenu={event => {
            event.preventDefault();
            if (onSelect) return;
            openMenu(event.clientX, event.clientY, "planItem", {
                id: String(plan.id), name: plan.name, type: "item",
                isMy: !!plan.is_owner, canPin: accepted, canComplete,
                pinned: !!plan.pinned, completed: !!plan.completed_for_me,
                shareToken: plan.is_owner && plan.visibility === "link" ? plan.share_token : undefined
            });
        }}>
        <PlanTagIcon plan={plan}/>
        <span className="habitInfo">
            <span className="habitName">
                <span className="habitNameText">{plan.name}</span>
                <ActivityIndicators part="streak" plan={plan}/>
                {plan.pinned && <PushPinIcon className="pinnedHabitSign" weight="fill" size={14}/>}
            </span>
            <span className="habitPer">
                {relativePlanDay(entry.date, t) || formatDateFromString(entry.date)} · {describeDayTime(entry, t)}
                {entry.completed && <CheckCircleIcon className="habitHLStatus" weight="fill"/>}
            </span>
        </span>
    </Link>;
}
