import { GearIcon, UserPlusIcon } from "@phosphor-icons/react";
import type { HabitSlideProps } from "../../HabitPage";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { api } from "../../../../components/ts/api";
import HabitMembers from "./HabitMembers";
import useHabitMembers from "./useHabitMembers";
import HabitPermissionSetting from "./HabitPermissionSetting";
import "../../scss/HabitChatMenu.scss";

export default function HabitChatMenu(_props: HabitSlideProps) {
    const { habit, loadHabit } = useTheHabit();
    const { setBlackout } = useBlackout();
    const { data, loading, error } = useHabitMembers(habit?.id);
    if (!habit) return null;
    return <div className="habitInnerSlide habitChatMenuSlide habitCollaborationOverview">
        <HabitMembers habitId={habit.id} data={data} loading={loading} error={error} />
        {!habit.chat_id && (data?.access.is_owner || data?.access.can_invite && !data?.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending"))) && <button type="button" className="addGoalButtDiv" onClick={() => setBlackout({ seted: true, module: "HabitParticipantPicker", point: data.access.is_owner && data.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending")) ? "shared" : "personal" })}>
            <UserPlusIcon />{data?.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending")) ? "Добавить в беседу" : "Добавить участников"}
        </button>}
        {data?.access.is_owner && habit.chat_id && <button type="button" className="addGoalButtDiv" onClick={() => setBlackout({ seted: true, module: "ConfirmAction", confirmAction: {
            title: "Отвязать активность от беседы?",
            description: "Текущие участники активности останутся в ней. Права, заданные через роли беседы, будут заменены правами активности.",
            label: "Отвязать",
            run: async () => {
                await api.patch(`habits/${habit.id}/chat`, { chat_id: null });
                await loadHabit(String(habit.id));
                window.dispatchEvent(new Event("habit-members-updated"));
            }
        } })}>Отвязать от беседы</button>}
        <HabitPermissionSetting field="complete_permission" label="Кто может отмечать выполнение" />
        <HabitPermissionSetting field="comment_permission" label="Кто может писать комментарии" />
        {data?.access.is_member && <button type="button" className="addGoalButtDiv habitCollaborationButton" onClick={() => setBlackout({ seted: true, module: "HabitCollaborationSettings" })}>
            <GearIcon weight="fill" />Настройки совместной активности
        </button>}
    </div>;
}
