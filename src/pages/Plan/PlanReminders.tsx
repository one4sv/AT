import { useEffect, useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../components/ts/api";

const presets = [10,60,1440];

export default function PlanReminders({ planId }: { planId: number }) {
    const { t } = useTranslation("common");
    const [rules, setRules] = useState<number[]>([]);
    const [globalEnabled, setGlobalEnabled] = useState(false);
    const [custom, setCustom] = useState("30");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        void Promise.all([
            api.get("plans/" + planId + "/reminders"),
            api.get("settings/plan-reminders")
        ]).then(([perPlan, global]) => {
            if (!active) return;
            if (!perPlan.data?.success || !global.data?.success) throw new Error();
            setRules(perPlan.data.rules || []);
            setGlobalEnabled(Boolean(global.data.preferences?.enabled));
            setError("");
        }).catch(() => {
            if (active) setError(t("plans.remindersLoadError"));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [planId, t]);

    const save = async (next: number[]) => {
        if (saving || loading) return;
        setSaving(true);
        setError("");
        try {
            const response = await api.post("plans/" + planId + "/reminders", {
                rules: [...next].sort((a,b) => a-b)
            });
            if (!response.data?.success) throw new Error();
            setRules(response.data.rules);
        } catch {
            setError(t("plans.remindersSaveError"));
        } finally {
            setSaving(false);
        }
    };
    const toggle = (minutes: number) => {
        const next = rules.includes(minutes) ? rules.filter(value => value !== minutes) : [...rules, minutes];
        if (next.length > 8) {
            setError(t("plans.reminderLimit"));
            return;
        }
        void save(next);
    };
    const addCustom = () => {
        const value = Number(custom);
        if (!Number.isSafeInteger(value) || value < 1 || value > 10080) {
            setError(t("plans.reminderInvalid"));
            return;
        }
        if (rules.includes(value)) return;
        toggle(value);
    };

    return <details className="planSection planRemindersSection">
        <summary className="planRemindersSummary">
            <BellIcon size={21}/>{t("plans.reminders")} ({rules.length})
        </summary>
        {loading ? <p>{t("plans.loading")}</p> : <>
            {!globalEnabled && <p className="planRemindersHint">
                {t("plans.remindersGlobalDisabled")} <Link to="/settings/notes">{t("plans.remindersOpenSettings")}</Link>
            </p>}
            <p className="planRemindersHint">{t("plans.remindersExplainer")}</p>
            <div className="planReminderChoices">
                {presets.map(minutes => <button type="button" key={minutes}
                    className={"planQuietButton " + (rules.includes(minutes) ? "selected" : "")}
                    aria-pressed={rules.includes(minutes)} disabled={saving}
                    onClick={() => toggle(minutes)}>
                    {t(minutes === 10 ? "plans.remind10m" : minutes === 60 ? "plans.remind1h" : "plans.remind1d")}
                </button>)}
            </div>
            <div className="planReminderCustom">
                <label htmlFor="planReminderMinutes">{t("plans.remindCustom")}</label>
                <input id="planReminderMinutes" type="number" value={custom} min={1} max={10080}
                    onChange={event => setCustom(event.target.value)}/>
                <button className="planPrimaryButton" type="button" disabled={saving}
                    onClick={addCustom}>{t("plans.remindAdd")}</button>
            </div>
            {rules.filter(minutes => !presets.includes(minutes)).map(minutes =>
                <button type="button" className="planQuietButton" key={minutes} disabled={saving}
                    onClick={() => toggle(minutes)}>
                    {t("plans.remindRemove", { count: minutes })}
                </button>
            )}
            {error && <p role="alert" className="planRemindersError">{error}</p>}
        </>}
    </details>;
}
