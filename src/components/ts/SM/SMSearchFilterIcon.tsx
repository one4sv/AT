import { BellRingingIcon, CalendarCheckIcon, ChatTeardropIcon, GearIcon, MagnifyingGlassIcon, NewspaperIcon, UserIcon, UsersIcon, SneakerMoveIcon } from "@phosphor-icons/react";
import type { SearchFilter } from "../utils/globalSearchQuery";

export default function SMSearchFilterIcon({ filter, size = 20 }: { filter: SearchFilter | null; size?: number }) {
    switch (filter) {
        case "ms": return <ChatTeardropIcon size={size}/>;
        case "new": return <BellRingingIcon size={size}/>;
        case "group": return <UsersIcon size={size}/>;
        case "habit": return <SneakerMoveIcon size={size}/>;
        case "plan": return <CalendarCheckIcon size={size}/>;
        case "user": return <UserIcon size={size}/>;
        case "post": return <NewspaperIcon size={size}/>;
        case "setting": return <GearIcon size={size}/>;
        default: return <MagnifyingGlassIcon size={size}/>;
    }
}
