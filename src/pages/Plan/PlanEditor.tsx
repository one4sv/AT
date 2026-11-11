import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import CalendarInput from "../../components/ts/CalendarInput";
import SelectList from "../../components/ts/SelectList";
import AutoDesc from "../../components/ts/utils/AutoDesc";
import type { OneOffPlan } from "../../components/context/PlansContext";
import "../../scss/modules/habitFormControls.scss";

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
export default function PlanEditor({ initial, initialDate, modal = false, saving, onSave, onClose }: {
    initial?: OneOffPlan;
    initialDate?: string;
    modal?: boolean;
    saving: boolean;
    onSave: (input: PlanInput) => Promise<void>;
    onClose: () => void;
}) {
    const { t } = useTranslation("common");
    const [value, setValue] = useState<PlanInput>({
        name: initial?.name || "",
        description: initial?.description || "",
        plan_date: initial?.plan_date || initialDate || localDate(new Date()),
        start_time: initial?.start_time?.slice(0, 5) || null,
        end_time: initial?.end_time?.slice(0, 5) || null,
        timezone: initial?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
        place: initial?.place || "",
        kind: initial?.kind || "personal",
        completion_mode: initial?.completion_mode || "personal"
    });

    function change<K extends keyof PlanInput>(key: K, next: PlanInput[K]) {
        setValue(previous => ({ ...previous, [key]: next }));
    }

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void onSave(value);
    };

    return <form className={modal ? "addHabitDiv addPlanDiv" : "planEditor"} onSubmit={submit}>
        {modal && <div className="addPlanHeading">{t("plans.create")}</div>}
        <div className="addHabitWrapper">
            <label htmlFor="planName">{t("plans.name")}</label>
            <input id="planName" className="addHabitInput" required maxLength={160}
                value={value.name} onChange={e => change("name", e.target.value)}/>
            <span>{value.name.length}/160</span>
        </div>
        <div className="addHabitWrapper">
            <label htmlFor="planDescription">{t("plans.description")}</label>
            <AutoDesc className="addHabitInput planDescription" maxLength={1200} value={value.description}
                onChange={next => change("description", next)}/>
            <span>{value.description.length}/1200</span>
        </div>
        <div className="addHabitWrapper">
            <label htmlFor="planDate">{t("plans.date")}</label>
            <CalendarInput id="planDate" value={value.plan_date ? new Date(value.plan_date + "T12:00:00") : null}
                onChange={date => change("plan_date", date ? localDate(date) : "")}
                className="addHabitInput planDateInput"/>
        </div>
        <div className="addHabitTimeWrapper">
            <div className="addHabitWrapper time">
                <label htmlFor="planStartTime">{t("plans.startTime")}</label>
                <input id="planStartTime" className="addHabitInput" type="time"
                    value={value.start_time || ""} onChange={e => change("start_time", e.target.value || null)}/>
            </div>
            <div className="addHabitWrapper time">
                <label htmlFor="planEndTime">{t("plans.endTime")}</label>
                <input id="planEndTime" className="addHabitInput" type="time"
                    value={value.end_time || ""} onChange={e => change("end_time", e.target.value || null)}/>
            </div>
        </div>
        {!initial && <div className="inpWrapperAddHabit">
            <label htmlFor="planKind">{t("plans.kind")}</label>
            <SelectList id="planKind" className="planFormSelect" selected={value.kind}
                arr={[{ value: "personal", label: t("plans.personal") },
                    { value: "shared", label: t("plans.shared") }]}
                onChange={next => {
                    const kind = next as PlanInput["kind"];
                    setValue(previous => ({ ...previous, kind,
                        completion_mode: kind === "personal" ? "personal" : previous.completion_mode }));
                }}/>
        </div>}
        {value.kind === "shared" && <div className="inpWrapperAddHabit">
            <label htmlFor="planCompletionMode">{t("plans.completionMode")}</label>
            <SelectList id="planCompletionMode" className="planFormSelect" selected={value.completion_mode}
                arr={[{ value: "personal", label: t("plans.individualCompletion") },
                    { value: "shared", label: t("plans.sharedCompletion") }]}
                onChange={next => change("completion_mode", next as PlanInput["completion_mode"])}/>
        </div>}
        <div className="addHabitWrapper">
            <label htmlFor="planPlace">{t("plans.place")}</label>
            <input id="planPlace" className="addHabitInput" maxLength={500} value={value.place}
                onChange={e => change("place", e.target.value)}/>
        </div>

        <div className={modal ? "addPlanActions" : "planEditorActions"}>
            {!modal && <button className="planQuietButton" type="button" onClick={onClose}>{t("plans.back")}</button>}
            <button className={modal ? "addHabitSave" : "planPrimaryButton"} type="submit"
                disabled={saving || !value.plan_date || !value.name.trim()}>
                {saving ? t("plans.saving") : t("plans.save")}
            </button>
        </div>
    </form>;
}
