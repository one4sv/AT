import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNote } from "../../../components/hooks/NoteHook";
import { api } from "../../../components/ts/api";
import SelectList from "../../../components/ts/SelectList";
import Toggler from "../../../components/ts/Toggler";
import HighlightText from "../../../components/ts/HighlightText";
import "../scss/PlanRemindersSettings.scss";

type Preferences = { enabled: boolean; defaultMinutesBefore: number };
const choices = [0,10,60,1440];

export default function PlanRemindersSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { showNotification } = useNote();
    const [prefs, setPrefs] = useState<Preferences>({ enabled: false, defaultMinutesBefore: 60 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        void api.get("settings/plan-reminders").then(response => {
            if (mounted && response.data?.success) setPrefs(response.data.preferences);
        }).catch(() => {
            if (mounted) showNotification("error", t("notifications.remindersLoadError"));
        }).finally(() => {
            if (mounted) setLoading(false);
        });
        return () => { mounted = false; };
    }, [showNotification, t]);

    const save = async (next: Preferences) => {
        if (saving || loading) return;
        setSaving(true);
        try {
            const result = await api.post("settings/plan-reminders", next);
            if (!result.data?.success) throw new Error("Failed to save plan reminder settings");
            setPrefs(result.data.preferences);
        } catch {
            showNotification("error", t("notifications.remindersSaveError"));
        } finally {
            setSaving(false);
        }
    };

    return <div className="settingInnerDiv planRemindersSettings" data-setting-id="planReminders">
        <div className="settingHeader">
            <HighlightText text={t("notifications.planRemindersTitle")} search={search}/>
        </div>
        <div className="settingInnerList">
            <div className="settingTogglerDiv" onClick={() => void save({ ...prefs, enabled: !prefs.enabled })}>
                <span>{t("notifications.planRemindersToggle")}</span>
                <Toggler state={prefs.enabled} disable={saving || loading}
                    onToggle={value => void save({ ...prefs, enabled: value })} stopPropagation={true}/>
            </div>
            <div className="settingHint">{t("notifications.planRemindersHint")}</div>
            <div className="planReminderDefault">
                <label htmlFor="defaultPlanReminder">{t("notifications.planRemindersDefault")}</label>
                <SelectList id="defaultPlanReminder" className="planReminderSelect" selected={String(prefs.defaultMinutesBefore)}
                    arr={choices.map(value => ({ value: String(value),
                        label: t(value === 0 ? "notifications.atStart" :
                            value === 10 ? "notifications.10minBefore" :
                            value === 60 ? "notifications.1hourBefore" : "notifications.1dayBefore") }))}
                    onChange={value => void save({ ...prefs, defaultMinutesBefore: Number(value) })}/>
            </div>
            <small className="settingHint">{t("notifications.planRemindersNoTime")}</small>
        </div>
    </div>;
}
