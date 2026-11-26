import { useState } from "react";
import { UserCircleIcon, SneakerMoveIcon, CalendarIcon, ArticleIcon, ChatsCircleIcon } from "@phosphor-icons/react";
import { tags } from "../../../components/ts/tags";

export interface ShareSearchResult {
    kind: string;
    id: string;
    label: string;
    avatar_url?: string | null;
    tag?: string | null;
}

export default function ShareSuggestionVisual({ item }: { item: ShareSearchResult }) {
    const [failedSrc, setFailedSrc] = useState<string | null>(null);
    const src = item.avatar_url;
    const TagIcon = item.kind === "habit" || item.kind === "plan" ? tags.find(tag => tag.value === item.tag)?.icon : null;
    const Icon = TagIcon || (item.kind === "habit" ? SneakerMoveIcon : item.kind === "plan" ? CalendarIcon :
        item.kind === "post" ? ArticleIcon : item.kind === "group" ? ChatsCircleIcon : UserCircleIcon);
    const showAvatar = ["habit", "user", "post", "group", "plan"].includes(item.kind) && src && failedSrc !== src;
    return <span className="shareSuggestionVisual" aria-hidden="true">
        {showAvatar ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailedSrc(src)}/> : <Icon size={24}/>}
    </span>;
}
