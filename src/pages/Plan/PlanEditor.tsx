import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import CalendarInput from "../../components/ts/CalendarInput";
import SelectList from "../../components/ts/SelectList";
import AutoDesc from "../../components/ts/utils/AutoDesc";
import type { OneOffPlan } from "../../components/context/PlansContext";

export interface PlanInput {
    name: string;
    description: string;
    plan_date: string;
    start_time: string | null;
    end_time: string | null;
    timezone: string;
    place: string;
    kind: "personal" | "shared";
    completion_mode: "personal" | "shared";
}
const localDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return [year, month, day].join("-");
};
export default function PlanEditor({ initial, saving, onSave, onClose }: {
    initial?: OneOffPlan;
    saving: boolean;
    onSave: (input: PlanInput) => Promise<void>;
    onClose: () => void;
}) {
    const { t } = useTranslation("common");
    const [value, setValue] = useState<PlanInput>({
        name: initial?.name || "",
        description: initial?.description || "",
        plan_date: initial?.plan_date || localDate(new Date()),
        start_time: initial?.start_time?.slice(0, 5) || null,
        end_time: initial?.end_time?.slice(0, 5) || null,
        timezone: initial?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
        place: initial?.place || "",
        kind: initial?.kind || "personal",
        completion_mode: initial?.completion_mode || "personal"
    });
    const change = <K extends keyof PlanInput>(key: K, next: PlanInput[K]) =>
        setValue(previous => ({ ...previous, [key]: next }));
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void onSave(value);
    };

    return <form className="planEditor" onSubmit={submit}>
        <label className="planInput">
            <span>{t("plans.name")}</span>
            <input required maxLength={160} value={value.name} onChange={e => change("name", e.target.value)}/>
        </label>
        <label className="planInput">
            <span>{t("plans.date")}</span>
            <CalendarInput value={value.plan_date ? new Date(value.plan_date + "T12:00:00") : null}
                onChange={date => change("plan_date", date ? localDate(date) : "")}
                className="planDateInput"/>
        </label>
        <div className="planTimeFields">
            <label className="planInput">
                <span>{t("plans.startTime")}</span>
                <input type="time" value={value.start_time || ""} onChange={e => change("start_time", e.target.value || null)}/>
            </label>
            <label className="planInput">
                <span>{t("plans.endTime")}</span>
                <input type="time" value={value.end_time || ""} onChange={e => change("end_time", e.target.value || null)}/>
            </label>
        </div>
        {!initial && <div className="planInput">
            <span>{t("plans.kind")}</span>
            <SelectList className="planSelectList"
                arr={[{ value:"personal", label:t("plans.personal") }, { value:"shared", label:t("plans.shared") }]}
                selected={value.kind} onChange={next => {
                    const kind = next as PlanInput["kind"];
                    setValue(previous => ({ ...previous, kind,
                        completion_mode: kind === "personal" ? "personal" : previous.completion_mode }));
                }}/>
        </div>}
        {value.kind === "shared" && <div className="planInput">
            <span>{t("plans.completionMode")}</span>
            <SelectList className="planSelectList"
                arr={[{ value:"personal", label:t("plans.individualCompletion") },
                    { value:"shared", label:t("plans.sharedCompletion") }]}
                selected={value.completion_mode} onChange={next => change("completion_mode", next as PlanInput["completion_mode"])}/>
        </div>}
        <label className="planInput">
            <span>{t("plans.place")}</span>
            <input maxLength={500} value={value.place} onChange={e => change("place", e.target.value)}/>
        </label>
        <div className="planInput">
            <span>{t("plans.description")}</span>
            <AutoDesc className="planDescription" value={value.description}
                onChange={next => change("description", next)}/>
        </div>
        <div className="planEditorActions">
            <button className="planQuietButton" type="button" onClick={onClose}>{t("plans.back")}</button>
            <button className="planPrimaryButton" disabled={saving || !value.plan_date || !value.name.trim()} type="submit">
                {saving ? t("plans.saving") : t("plans.save")}
            </button>
        </div>
    </form>;
}
