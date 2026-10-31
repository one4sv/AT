import { useState } from "react";
import axios from "axios";
import RadioGroup from "../ts/RadioGroup";
import { XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import "../../pages/HabitPage/scss/HabitChatMenu.scss";

type CollaborationSettings = {
    metric_progress_mode: "personal" | "shared";
    schedule_blocks_mode: "personal" | "shared";
    members_can_edit_blocks: boolean;
    members_can_edit_info: boolean;
    members_can_invite: boolean;
};

export default function HabitCollaborationSettings() {
    const { habit } = useTheHabit();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<CollaborationSettings>({
        metric_progress_mode: habit?.metric_progress_mode || "personal",
        schedule_blocks_mode: habit?.schedule_blocks_mode || "shared",
        members_can_edit_blocks: !!habit?.members_can_edit_blocks,
        members_can_edit_info: !!habit?.members_can_edit_info,
        members_can_invite: !!habit?.members_can_invite
    });
    const updateSettings = async (changes: Partial<CollaborationSettings>) => {
        if (!habit || saving) return;
        const old = settings;
        setSettings(current => ({...current, ...changes}));
        setSaving(true);
        try {
            const result = await api.patch(`habits/${habit.id}/collaboration`, changes);
            if (!result.data.success) throw new Error("Save failed");
            window.dispatchEvent(new CustomEvent("habit-collaboration-updated", { detail: { habitId: habit.id, changes } }));
        } catch (error) {
            setSettings(old);
            showNotification("error", axios.isAxiosError(error) ? error.response?.data?.error || "Ошибка сохранения" : "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };
    return <div className="habitCollaborationModal" role="dialog" aria-modal="true" aria-label="Настройки совместной активности">
        <div className="habitCollaborationHeader">
            <span>Настройки совместной активности</span>
            <button type="button" onClick={() => setBlackout({ seted: false })} aria-label="Закрыть"><XIcon size={24}/></button>
        </div>
        <div className="habitCollaborationBody">
                <div className="privateSLWrapper">
                    <div className="settingSpan">Таймер и счётчик</div>
                    <RadioGroup list={[
                        { label: "У каждого свой прогресс", value: "personal" },
                        { label: "Общий для всех участников", value: "shared" }
                    ]} id="habitMetricProgress" val={settings.metric_progress_mode}
                        disabled={saving}
                        newVal={value => { if (value === "personal" || value === "shared") void updateSettings({ metric_progress_mode: value }); }}/>
                    <div className="settingHint">Общий режим объединяет измерения участников. Личный режим сохраняет независимые показатели.</div>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Блоки расписания и задачи</div>
                    <RadioGroup list={[
                        { label: "Общие блоки", value: "shared" },
                        { label: "У каждого свои блоки", value: "personal" }
                    ]} id="habitScheduleBlocks" val={settings.schedule_blocks_mode}
                        disabled={saving}
                        newVal={value => { if (value === "personal" || value === "shared") void updateSettings({ schedule_blocks_mode: value }); }}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто может менять блоки</div>
                    <RadioGroup list={[
                        { label: "Только владелец", value: "owner" },
                        { label: "Все участники", value: "members" }
                    ]} id="habitBlocksPermission" val={settings.members_can_edit_blocks ? "members" : "owner"}
                        disabled={saving}
                        newVal={value => void updateSettings({ members_can_edit_blocks: value === "members" })}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто может изменять информацию активности</div>
                    <RadioGroup list={[
                        { label: "Только владелец", value: "owner" },
                        { label: "Все участники", value: "members" }
                    ]} id="habitInfoPermission" val={settings.members_can_edit_info ? "members" : "owner"}
                        disabled={saving}
                        newVal={value => void updateSettings({ members_can_edit_info: value === "members" })}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто может приглашать участников</div>
                    <RadioGroup list={[
                        { label: "Только владелец", value: "owner" },
                        { label: "Все участники", value: "members" }
                    ]} id="habitInvitePermission" val={settings.members_can_invite ? "members" : "owner"}
                        disabled={saving}
                        newVal={value => void updateSettings({ members_can_invite: value === "members" })}/>
                </div>


        </div>
        <button type="button" className="habitCollaborationClose" onClick={() => setBlackout({ seted: false })}>Готово</button>
    </div>;
}
