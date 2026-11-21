import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FlagIcon } from "@phosphor-icons/react";
import { api } from "../../../components/ts/api";
import { tags } from "../../../components/ts/tags";
import { formatAppDate, formatClock } from "../../../components/ts/utils/dateToStr";
import "../scss/HabitInvitation.scss";

type CreatedEntity = {
    id: number;
    name: string;
    tag?: string | null;
    plan_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    periodicity?: string;
};

export type CreatedEntityReference = {
    kind: "plan" | "habit";
    id: number;
    title: string;
};

// Only recognize a two-line status and an AT link in a self-chat message.
// This avoids parsing arbitrary commands, posts or untrusted external links.
export function parseCreatedEntityMessage(content: string): CreatedEntityReference | null {
    const parts = content.split("\n");
    if (parts.length !== 2) return null;
    const kinds: Record<string, "plan" | "habit"> = {
        "План создан": "plan", "Plan created": "plan",
        "Активность создана": "habit", "Activity created": "habit"
    };
    const kind = kinds[parts[0]];
    if (!kind) return null;
    try {
        const url = new URL(parts[1]);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        if (url.host !== window.location.host && url.host !== "achievetogether.vercel.app") return null;
        const matched = url.pathname.match(/^\/(plan|habit)\/(\d+)$/);
        if (!matched || matched[1] !== kind || !Number.isSafeInteger(+matched[2]) || +matched[2] <= 0) return null;
        return { kind, id: +matched[2], title: parts[0] };
    } catch {
        return null;
    }
}

export default function CreatedEntityCard({ item }: { item: CreatedEntityReference }) {
    const [entity, setEntity] = useState<CreatedEntity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setEntity(null);
        void api.get((item.kind === "plan" ? "plans/" : "habits/") + item.id, {
            signal: controller.signal
        }).then(response => {
            if (!controller.signal.aborted && response.data?.success)
                setEntity(item.kind === "plan" ? response.data.plan : response.data.habit);
        }).catch(() => {
            // A deleted or inaccessible object keeps its ordinary link, not private metadata.
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => controller.abort();
    }, [item.kind, item.id]);

    const Icon = tags.find(tag => tag.value === entity?.tag)?.icon || FlagIcon;
    const details = entity ? item.kind === "plan"
        ? [entity.plan_date ? formatAppDate(entity.plan_date) : "", entity.start_time ? formatClock(entity.start_time) : "", entity.end_time ? formatClock(entity.end_time) : ""].filter(Boolean).join(" · ")
        : [entity.periodicity || "", entity.start_time ? formatClock(entity.start_time) : "", entity.end_time ? formatClock(entity.end_time) : ""].filter(Boolean).join(" · ") : "";

    return <div className="habitInvitation createdEntityCard" onDoubleClick={event => event.stopPropagation()}>
        <div className="habitInvitationTitle">{item.title}</div>
        <Link className="habit habitInvitationHabit" to={`/${item.kind}/${item.id}`}>
            <div className="habitIcon"><Icon className="habitIconSvg"/></div>
            <div className="habitInfo">
                <div className="habitName">{entity?.name || (loading ? "…" : item.title)}</div>
                {details && <div className="habitPer">{details}</div>}
            </div>
        </Link>
    </div>;
}
