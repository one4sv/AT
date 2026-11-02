import { useState } from "react";
import RadioGroup from "../ts/RadioGroup";
import { XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import HabitPermissionSetting from "../../pages/HabitPage/components/HabitInfo/HabitPermissionSetting";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";

export default function HabitCollaborationSettings() {
    const { habit, loadHabit } = useTheHabit();
    const { user } = useUser();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ saving, setSaving ] = useState(false);
    if (!habit) return null;
    const isOwner = habit.user_id === user.id;
    const updateMode = async (field: "completion_mode" | "metric_progress_mode" | "schedule_blocks_mode", value: string) => {
        if (!isOwner || saving || !["personal", "shared"].includes(value)) return;
        setSaving(true);
        try {
            await api.patch(`habits/${habit.id}/collaboration`, { [field]: value });
            await loadHabit(String(habit.id));
            window.dispatchEvent(new Event("habit-members-updated"));
        } catch {
            showNotification("error", "Не удалось сохранить настройки");
        } finally {
            setSaving(false);
        }
    };
    const modeSetting = (field: "completion_mode" | "metric_progress_mode" | "schedule_blocks_mode", title: string) => <div className="privateSLWrapper">
        <div className="settingSpan">{title}</div>
        {isOwner ? <RadioGroup list={[{ label: field === "completion_mode" ? "У каждого своё" : "У каждого свой", value: "personal" }, { label: field === "completion_mode" ? "Общее для всех" : "Общий для всех", value: "shared" }]} id={field} val={habit[field] || (field === "schedule_blocks_mode" ? "shared" : "personal")} disabled={saving} newVal={value => void updateMode(field, value)} /> : <div className="habitSettingValue">{habit[field] === "personal" ? (field === "completion_mode" ? "У каждого своё" : "У каждого свой") : (field === "completion_mode" ? "Общее для всех" : "Общий для всех")}</div>}
    </div>;
    return <div className="habitCollaborationModal" role="dialog" aria-modal="true" aria-label="Настройки совместной активности">
        <div className="habitCollaborationHeader"><span>Настройки совместной активности</span><button type="button" onClick={() => setBlackout({ seted: false })} aria-label="Закрыть"><XIcon /></button></div>
        <div className="habitCollaborationBody">
            {modeSetting("completion_mode", "Выполнение")}
            {modeSetting("metric_progress_mode", "Таймер, счётчик и задачи")}
            {modeSetting("schedule_blocks_mode", "Блоки расписания")}
            {habit.chat_id && <div className="privateSLWrapper">
                <div className="settingSpan">Участие в активности беседы</div>
                {isOwner ? <RadioGroup list={[{ label: "По желанию", value: "optional" }, { label: "Для всех участников беседы", value: "required" }]} id="habitChatParticipation" val={habit.chat_participation_mode || "optional"} disabled={saving} newVal={async mode => {
                    if (saving) return;
                    setSaving(true);
                    try {
                        await api.patch(`habits/${habit.id}/chat-mode`, { mode });
                        await loadHabit(String(habit.id));
                        window.dispatchEvent(new Event("habit-members-updated"));
                    } catch {
                        showNotification("error", "Не удалось изменить участие в беседе");
                    } finally {
                        setSaving(false);
                    }
                }} /> : <div className="habitSettingValue">{habit.chat_participation_mode === "required" ? "Для всех участников беседы" : "По желанию"}</div>}
            </div>}
            <HabitPermissionSetting field="edit_blocks_permission" label="Кто может менять блоки" />
            <HabitPermissionSetting field="edit_info_permission" label="Кто может изменять информацию" />
            <HabitPermissionSetting field="invite_permission" label="Кто может приглашать участников" />
        </div>
        <button type="button" className="habitCollaborationClose" onClick={() => setBlackout({ seted: false })}>Готово</button>
    </div>;
}
