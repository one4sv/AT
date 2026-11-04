import { CalendarCheckIcon, ChatTeardropIcon, GearIcon, NewspaperIcon, SneakerMoveIcon, UserIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useContacts } from "../../hooks/ContactsHook";
import { useHabits } from "../../hooks/HabitsHook";
import { useUser } from "../../hooks/UserHook";
import type { QuickAction } from "../../context/SettingsContext";

export function quickActionPath(action: QuickAction, ownNick: string | null) {
    switch (action.type) {
        case "feed": return "/";
        case "settings": return "/settings";
        case "profile": return ownNick ? `/acc/${encodeURIComponent(ownNick)}` : "/acc";
        case "habits": return "/habit";
        case "habit": return action.target ? `/habit/${action.target}` : "/habit";
        case "chat": return action.target
            ? action.target.startsWith("g/")
                ? `/chat/g/${action.target.slice(2)}`
                : `/chat/${encodeURIComponent(action.target)}`
            : "/settings/gen";
    }
}

export function QuickActionVisual({ action, inMenu = false }: { action: QuickAction; inMenu?: boolean }) {
    const { t } = useTranslation("settings");
    const { user } = useUser();
    const { list } = useContacts();
    const { habits } = useHabits();
    const contact = action.type === "chat" ? list.find(item =>
        item.is_group ? `g/${item.id}` === action.target : item.nick === action.target
    ) : undefined;
    const habit = action.type === "habit" ? habits?.find(item => String(item.id) === action.target) : undefined;
    const avatar = action.type === "profile" ? user.avatar_url : contact?.avatar_url;
    const label =
        action.type === "feed" ? t("general.quickActionsFeed") :
        action.type === "settings" ? t("general.quickActionsSettings") :
        action.type === "profile" ? t("general.quickActionsProfile") :
        action.type === "habits" ? t("general.quickActionsHabits") :
        action.type === "habit" ? habit?.name || action.label || t("general.quickActionsHabit") :
        contact?.name || contact?.nick || action.label || t("general.quickActionsChat");
    const Icon =
        action.type === "feed" ? NewspaperIcon :
        action.type === "settings" ? GearIcon :
        action.type === "profile" ? UserIcon :
        action.type === "habits" ? SneakerMoveIcon :
        action.type === "habit" ? CalendarCheckIcon : ChatTeardropIcon;

    const image = avatar ? <img src={avatar} alt=""/> : <Icon size={21} weight="fill" color="var(--accent_text)"/>;

    if (inMenu) return <>{image}{label}</>;

    return (
        <span className="quickActionVisual">
            {image}
            <span>{label}</span>
        </span>
    );
}
