import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("common");
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
            showNotification("error", t("habitDialog.saveFailed"));
        } finally {
            setSaving(false);
        }
    };
    const modeSetting = (field: "completion_mode" | "metric_progress_mode" | "schedule_blocks_mode", title: string) => <div className="privateSLWrapper">
        <div className="settingSpan">{title}</div>
        {isOwner ? <RadioGroup list={[{ label: field === "completion_mode" ? t("habitDialog.modeOwn") : t("habitDialog.modePersonal"), value: "personal" }, { label: field === "completion_mode" ? t("habitDialog.modeAll") : t("habitDialog.modeShared"), value: "shared" }]} id={field} val={habit[field] || (field === "schedule_blocks_mode" ? "shared" : "personal")} disabled={saving} newVal={value => void updateMode(field, value)} /> : <div className="habitSettingValue">{habit[field] === "personal" ? (field === "completion_mode" ? t("habitDialog.modeOwn") : t("habitDialog.modePersonal")) : (field === "completion_mode" ? t("habitDialog.modeAll") : t("habitDialog.modeShared"))}</div>}
    </div>;
    return <div className="habitCollaborationModal" role="dialog" aria-modal="true" aria-label={t("habitDialog.settings")}>
        <div className="habitCollaborationHeader"><span>{t("habitDialog.settings")}</span><button type="button" onClick={() => setBlackout({ seted: false })} aria-label={t("habitDialog.close")}><XIcon /></button></div>
        <div className="habitCollaborationBody">
            {modeSetting("completion_mode", t("habitDialog.completion"))}
            {modeSetting("metric_progress_mode", t("habitDialog.metrics"))}
            {modeSetting("schedule_blocks_mode", t("habitDialog.blocks"))}
            {habit.chat_id && <div className="privateSLWrapper">
                <div className="settingSpan">{t("habitDialog.participation")}</div>
                {isOwner ? <RadioGroup list={[{ label: t("habitDialog.optional"), value: "optional" }, { label: t("habitDialog.required"), value: "required" }]} id="habitChatParticipation" val={habit.chat_participation_mode || "optional"} disabled={saving} newVal={async mode => {
                    if (saving) return;
                    setSaving(true);
                    try {
                        await api.patch(`habits/${habit.id}/chat-mode`, { mode });
                        await loadHabit(String(habit.id));
                        window.dispatchEvent(new Event("habit-members-updated"));
                    } catch {
                        showNotification("error", t("habitDialog.participationFailed"));
                    } finally {
                        setSaving(false);
                    }
                }} /> : <div className="habitSettingValue">{habit.chat_participation_mode === "required" ? t("habitDialog.required") : t("habitDialog.optional")}</div>}
            </div>}
            <HabitPermissionSetting field="edit_blocks_permission" label={t("habitDialog.canEditBlocks")} />
            <HabitPermissionSetting field="edit_info_permission" label={t("habitDialog.canEditInfo")} />
            <HabitPermissionSetting field="invite_permission" label={t("habitDialog.canInvite")} />
        </div>
        <button type="button" className="habitCollaborationClose" onClick={() => setBlackout({ seted: false })}>{t("habitDialog.done")}</button>
    </div>;
}
