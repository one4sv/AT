import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircleIcon, CalendarBlankIcon, CheckCircleIcon, ArticleIcon, ChatsCircleIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../components/ts/api";
import "../scss/HabitInvitation.scss";
import "../scss/SharedEntityCard.scss";

export type SharedEntityKind = "user" | "habit" | "plan" | "post" | "group";
interface SharedEntityPreview {
    kind: SharedEntityKind;
    id: string;
    name: string;
    subtitle?: string;
    url: string;
    avatar_url?: string | null;
}
const icons = {
    user: UserCircleIcon, habit: CheckCircleIcon, plan: CalendarBlankIcon,
    post: ArticleIcon, group: ChatsCircleIcon
};
export default function SharedEntityCard({kind,id}: {kind: SharedEntityKind; id: string}) {
    const { t } = useTranslation("common");
    const [item,setItem] = useState<SharedEntityPreview | null>(null);
    useEffect(() => {
        const controller = new AbortController();
        setItem(null);
        void api.get("chat/entity/" + kind + "/" + encodeURIComponent(id), {
            signal: controller.signal
        }).then(response => {
            if (!controller.signal.aborted && response.data?.success) setItem(response.data.item);
        }).catch(() => {});
        return () => controller.abort();
    }, [kind,id]);
    if (!item) return <div className="habitInvitation sharedEntityCard">
        <span className="sharedEntityUnavailable">{t("chatUi.sharedEntityUnavailable")}</span>
    </div>;
    const Icon = icons[kind];
    return <div className="habitInvitation sharedEntityCard"
        onDoubleClick={event => event.stopPropagation()}>
        <Link className="habit habitInvitationHabit" to={item.url}>
            <div className="habitIcon">{item.avatar_url ? <img className="sharedEntityAvatar"
                src={item.avatar_url} alt=""/> : <Icon className="habitIconSvg"/>}</div>
            <div className="habitInfo">
                <div className="habitName">{item.name}</div>
                {item.subtitle && <div className="habitPer">{item.subtitle}</div>}
            </div>
        </Link>
    </div>;
}
