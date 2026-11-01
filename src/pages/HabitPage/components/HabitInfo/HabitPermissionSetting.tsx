import { useState } from "react";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useUser } from "../../../../components/hooks/UserHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import { api } from "../../../../components/ts/api";
import type { HabitPermission } from "../../../../components/context/HabitsContext";

export default function HabitPermissionSetting({ field, label }: { field: "complete_permission" | "comment_permission" | "edit_blocks_permission" | "edit_info_permission" | "invite_permission"; label: string }) {
    const { habit, loadHabit } = useTheHabit();
    const { user } = useUser();
    const { showNotification } = useNote();
    const [ saving, setSaving ] = useState(false);
    if (!habit) return null;
    const list = [{ label: "Только владелец", value: "owner" }, { label: "Все участники", value: "members" }];
    if (habit.chat_id) list.push({ label: "Участники с правом в беседе", value: "roles" });
    const legacy = field === 'edit_blocks_permission' ? habit.members_can_edit_blocks : field === 'edit_info_permission' ? habit.members_can_edit_info : field === 'invite_permission' ? habit.members_can_invite : undefined;
    const value = habit[field] || (legacy ? 'members' : undefined) || (field === "complete_permission" || field === "comment_permission" ? "members" : "owner");
    const update = async (policy: string) => {
        if (saving || habit.user_id !== user.id || !["owner", "members", "roles"].includes(policy)) return;
        setSaving(true);
        try {
            await api.patch(`habits/${habit.id}/collaboration`, { [field]: policy as HabitPermission });
            await loadHabit(String(habit.id));
            window.dispatchEvent(new Event("habit-members-updated"));
        } catch {
            showNotification("error", "Не удалось сохранить права");
        } finally {
            setSaving(false);
        }
    };
    return <div className="privateSLWrapper">
        <div className="settingSpan">{label}</div>
        {habit.user_id === user.id ? <RadioGroup list={list} id={field} val={value} disabled={saving} newVal={value => void update(value)} /> : <div className="habitSettingValue">{list.find(item => item.value === value)?.label || "По правам беседы"}</div>}
    </div>;
}
