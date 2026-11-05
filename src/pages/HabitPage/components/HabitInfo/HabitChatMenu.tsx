import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("common");
    const { habit, loadHabit } = useTheHabit();
    const { setBlackout } = useBlackout();
    const { data, loading, error } = useHabitMembers(habit?.id);
    if (!habit) return null;
    return <div className="habitInnerSlide habitChatMenuSlide habitCollaborationOverview">
        <HabitMembers habitId={habit.id} data={data} loading={loading} error={error} />
        {!habit.chat_id && (data?.access.is_owner || data?.access.can_invite && !data?.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending"))) && <button type="button" className="addGoalButtDiv" onClick={() => setBlackout({ seted: true, module: "HabitParticipantPicker", point: data.access.is_owner && data.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending")) ? "shared" : "personal" })}>
            <UserPlusIcon />{data?.members.some(member => member.user_id !== data.owner_id && (member.status === "accepted" || member.status === "pending")) ? t("habitExtra.addToChat") : t("habitExtra.addMembers")}
        </button>}
        {data?.access.is_owner && habit.chat_id && <button type="button" className="addGoalButtDiv" onClick={() => setBlackout({ seted: true, module: "ConfirmAction", confirmAction: {
            title: t("habitExtra.unlinkTitle"),
            description: t("habitExtra.unlinkDescription"),
            label: t("habitExtra.unlink"),
            run: async () => {
                await api.patch(`habits/${habit.id}/chat`, { chat_id: null });
                await loadHabit(String(habit.id));
                window.dispatchEvent(new Event("habit-members-updated"));
            }
        } })}>{t("habitExtra.unlinkFromChat")}</button>}
        <HabitPermissionSetting field="complete_permission" label={t("habitExtra.canComplete")} />
        <HabitPermissionSetting field="comment_permission" label={t("habitExtra.canComment")} />
        {data?.access.is_member && <button type="button" className="addGoalButtDiv habitCollaborationButton" onClick={() => setBlackout({ seted: true, module: "HabitCollaborationSettings" })}>
            <GearIcon weight="fill" />{t("habitDialog.settings")}
        </button>}
    </div>;
}
