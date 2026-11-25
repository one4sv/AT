import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircleIcon, ChatsCircleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../components/ts/api";
import { tags } from "../../../components/ts/tags";
import { formatClock, formatDateFromString } from "../../../components/ts/utils/dateToStr";
import "../scss/SharedEntityCard.scss";
import "../../../scss/Loading.scss";

export type SharedEntityKind = "user" | "habit" | "plan" | "post" | "group";
interface SharedEntityPreview {
    kind: SharedEntityKind;
    id: string;
    name: string;
    subtitle?: string;
    url: string;
    avatar_url?: string | null;
    periodicity?: string | null;
    tag?: string | null;
    plan_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    author?: string | null;
    author_nick?: string | null;
    excerpt?: string | null;
}
const icons = {
    user: UserCircleIcon,
    group: ChatsCircleIcon
};
export default function SharedEntityCard({kind,id,fallbackUrl}: {kind: SharedEntityKind; id: string; fallbackUrl?: string}) {
    const { t } = useTranslation("common");
    const [item,setItem] = useState<SharedEntityPreview | null>(null);
    const [loading,setLoading] = useState(true);
    useEffect(() => {
        const controller = new AbortController();
        setItem(null);
        setLoading(true);
        void api.get("chat/entity/" + kind + "/" + encodeURIComponent(id), {
            signal: controller.signal
        }).then(response => {
            if (!controller.signal.aborted && response.data?.success) setItem(response.data.item);
        }).catch(() => {}).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => controller.abort();
    }, [kind,id]);
    if (!item && loading) return <div className={`sharedEntityCard sharedEntitySkeleton sharedEntity${kind}`}
        role="status" aria-label={t("sideMenu.globalSearchLoading")} aria-busy="true">
        <span className="sharedEntitySkeletonRow" aria-hidden="true">
            <span className="skeletonCircle"/>
            <span className="sharedEntitySkeletonLines">
                <span className="skeletonLine"/>
                <span className="skeletonLine skeletonShort"/>
            </span>
        </span>
        {kind === "post" && <div className="sharedEntitySkeletonPost" aria-hidden="true">
            <span className="skeletonLine"/>
            <span className="skeletonLine"/>
            <span className="skeletonLine skeletonShort"/>
        </div>}
    </div>;
    if (!item) return <div className="sharedEntityCard sharedEntityUnavailable">
        {fallbackUrl ? <a href={fallbackUrl} onClick={event => event.stopPropagation()}>{fallbackUrl}</a> : t("chatUi.sharedEntityUnavailable")}
    </div>;
    // Match the tag icon rendered by HabitDiv/PlanDiv; no unrelated placeholder for untagged entities.
    const Icon = kind === "habit" || kind === "plan"
        ? tags.find(tag => tag.value === item.tag)?.icon : kind === "user" || kind === "group" ? icons[kind] : null;
    const details = kind === "habit" ? [
        item.periodicity && ["everyday", "weekly", "cycle", "sometimes"].includes(item.periodicity)
            ? t("habitUi.period." + item.periodicity) : "",
        item.start_time ? formatClock(item.start_time) : "",
        item.end_time ? formatClock(item.end_time) : ""
    ].filter(Boolean).join(" · ") : kind === "plan" ? [
        item.plan_date && /^\d{4}-\d{2}-\d{2}$/.test(item.plan_date)
            ? formatDateFromString(item.plan_date) : "",
        item.start_time ? formatClock(item.start_time) : "",
        item.end_time ? formatClock(item.end_time) : ""
    ].filter(Boolean).join(" · ") : item.subtitle || "";
    const postAuthor = <>
        <span className="sharedEntityIcon">
            {item.avatar_url ? <img src={item.avatar_url} alt=""/> : <UserCircleIcon/>}
        </span>
        <span className="sharedEntityPostAuthorName">{item.author || item.name}</span>
    </>;
    return <div className={`sharedEntityCard sharedEntity${kind} ${kind === "plan" && !Icon ? "withoutIcon" : ""}`}
        onDoubleClick={event => event.stopPropagation()}>
        {kind === "post" ? <>
            {item.author_nick ? <Link className="sharedEntityPostAuthor" to={"/acc/" + encodeURIComponent(item.author_nick)}>
                {postAuthor}
            </Link> : <div className="sharedEntityPostAuthor">{postAuthor}</div>}
            {item.excerpt && <div className="sharedEntityPostExcerpt">{item.excerpt}</div>}
            <Link className="sharedEntityPostOpen" to={item.url}>
                {t("chatUi.openSharedPost")}
            </Link>
        </> : <Link className="sharedEntityLink" to={item.url}>
            {(item.avatar_url && (kind === "user" || kind === "group" || kind === "habit") || Icon) && <span className="sharedEntityIcon">
                {item.avatar_url && (kind === "user" || kind === "group" || kind === "habit")
                    ? <img src={item.avatar_url} alt=""/> : Icon ? <Icon/> : null}
            </span>}
            <span className="sharedEntityInfo">
                <span className="sharedEntityName">{item.name}</span>
                {details && <span className="sharedEntityDetails">{details}</span>}
            </span>
        </Link>}
    </div>;
}
