import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import RadioGroup from "../ts/RadioGroup";
import CalendarInput from "../ts/CalendarInput";
import TA from "../ts/TA";
import type { Goal, GoalProgressMode } from "../../pages/Goals/types";
import "./scss/addGoal.scss";

interface DraftMilestone { title: string; weight: number }

export default function AddGoal() {
    const { t } = useTranslation("common");
    const { blackout, setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const navigate = useNavigate();
    const id = blackout.options?.id;
    const [loading, setLoading] = useState(Boolean(id));
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [mode, setMode] = useState<GoalProgressMode>("manual");
    const [manual, setManual] = useState(0);
    const [metricStart, setMetricStart] = useState(0);
    const [metricTarget, setMetricTarget] = useState(100);
    const [metricCurrent, setMetricCurrent] = useState(0);
    const [unit, setUnit] = useState("");
    const [metricShare, setMetricShare] = useState(70);
    const [stages, setStages] = useState<DraftMilestone[]>([]);

    useEffect(() => {
        if (!id) return;
        let active = true;
        void api.get<{ success:boolean; goal:Goal }>("goals/" + id).then(({ data }) => {
            if (!active) return;
            const g = data.goal;
            setName(g.name);
            setDescription(g.description || "");
            setDueDate(g.due_date ? new Date(g.due_date + "T12:00:00") : null);
            setMode(g.progress_mode);
            setManual(Number(g.manual_progress));
            setMetricStart(Number(g.metric_start));
            setMetricTarget(Number(g.metric_target));
            setMetricCurrent(Number(g.metric_current));
            setUnit(g.metric_unit || "");
            setMetricShare(Number(g.metric_share) * 100);
        }).catch(() => {
            if (active) showNotification("error", t("goals.loadError"));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [id, showNotification, t]);

    const dateValue = dueDate ? [
        dueDate.getFullYear(),
        String(dueDate.getMonth() + 1).padStart(2, "0"),
        String(dueDate.getDate()).padStart(2, "0")
    ].join("-") : null;

    const save = async () => {
        if (saving || !name.trim()) return;
        if (["metric", "combined"].includes(mode) && metricStart === metricTarget) {
            showNotification("error", t("goals.invalidMetric"));
            return;
        }
        if (stages.some(stage => !stage.title.trim() || stage.weight <= 0)) {
            showNotification("error", t("goals.invalidStage"));
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name:name.trim(),
                description,
                due_date:dateValue,
                progress_mode:mode,
                manual_progress:manual,
                metric_start:metricStart,
                metric_target:metricTarget,
                metric_current:metricCurrent,
                metric_unit:unit,
                metric_share:metricShare / 100
            };
            const response = id ? await api.patch("goals/" + id, payload) :
                await api.post("goals", { ...payload, milestones:stages.map(stage => ({
                    title:stage.title.trim(), weight:stage.weight
                })) });
            if (!response.data?.success) throw new Error("Save rejected");
            setBlackout({ seted:false });
            window.dispatchEvent(new Event("goals-updated"));
            showNotification("success", t(id ? "goals.saved" : "goals.created"));
            navigate("/goal/" + response.data.goal.id);
        } catch {
            showNotification("error", t("goals.saveError"));
        } finally {
            setSaving(false);
        }
    };
    const modes = [
        { value:"manual", label:t("goals.manual") },
        { value:"metric", label:t("goals.metric") },
        { value:"milestones", label:t("goals.stages") },
        { value:"combined", label:t("goals.combined") }
    ];

    return <div className="addHabitDiv addGoalDiv">
        <h2>{t(id ? "goals.edit" : "goals.create")}</h2>
        {loading ? <div className="goalLoading">{t("goals.loading")}</div> : <>
            <div className="goalInput">
                <label htmlFor="goalName">{t("goals.name")}</label>
                <input id="goalName" className="addHabitInput" maxLength={160} value={name}
                    onChange={event => setName(event.target.value)}/>
            </div>
            <div className="goalInput">
                <label htmlFor="goalDescription">{t("goals.description")}</label>
                <TA id="goalDescription" className="addHabitInput" maxLength={1200}
                    value={description} onChange={event => setDescription(event.target.value)}/>
            </div>
            <div className="goalInput">
                <label htmlFor="goalDueDate">{t("goals.dueDate")}</label>
                <CalendarInput id="goalDueDate" value={dueDate} onChange={setDueDate}
                    className="addHabitInput" placeholder={t("goals.optional")}/>
            </div>
            <div className="goalInput">
                <label>{t("goals.progressMethod")}</label>
                <RadioGroup id="goalProgressMode" list={modes} val={mode}
                    newVal={value => setMode(value as GoalProgressMode)}/>
            </div>
            {mode === "manual" && <div className="goalInput">
                <label htmlFor="goalManual">{t("goals.progress")} — {manual}%</label>
                <input id="goalManual" type="range" min={0} max={100} value={manual}
                    onChange={event => setManual(Number(event.target.value))}/>
            </div>}
            {(mode === "metric" || mode === "combined") && <>
                <div className="goalMetrics">
                    <div className="goalInput">
                        <label htmlFor="goalMetricStart">{t("goals.start")}</label>
                        <input id="goalMetricStart" className="addHabitInput" type="number" value={metricStart}
                            onChange={event => setMetricStart(Number(event.target.value))}/>
                    </div>
                    <div className="goalInput">
                        <label htmlFor="goalMetricCurrent">{t("goals.current")}</label>
                        <input id="goalMetricCurrent" className="addHabitInput" type="number" value={metricCurrent}
                            onChange={event => setMetricCurrent(Number(event.target.value))}/>
                    </div>
                    <div className="goalInput">
                        <label htmlFor="goalMetricTarget">{t("goals.target")}</label>
                        <input id="goalMetricTarget" className="addHabitInput" type="number" value={metricTarget}
                            onChange={event => setMetricTarget(Number(event.target.value))}/>
                    </div>
                </div>
                <div className="goalInput">
                    <label htmlFor="goalMetricUnit">{t("goals.unit")}</label>
                    <input id="goalMetricUnit" className="addHabitInput" value={unit} maxLength={24}
                        onChange={event => setUnit(event.target.value)}/>
                </div>
            </>}
            {mode === "combined" && <div className="goalInput">
                <label htmlFor="goalShare">{t("goals.metricShare")} — {metricShare}%</label>
                <input id="goalShare" type="range" min={0} max={100} value={metricShare}
                    onChange={event => setMetricShare(Number(event.target.value))}/>
            </div>}
            {!id && <div className="goalInput">
                <label>{t("goals.stagesOptional")}</label>
                {stages.map((stage, index) => <div className="goalStageDraft" key={index}>
                    <input className="addHabitInput" maxLength={160} value={stage.title}
                        aria-label={t("goals.stageName")} onChange={event => setStages(current => current.map((item, i) =>
                            i === index ? { ...item, title:event.target.value } : item))}/>
                    <input className="addHabitInput" type="number" min={0.001} step={0.5} value={stage.weight}
                        aria-label={t("goals.weight")} onChange={event => setStages(current => current.map((item, i) =>
                            i === index ? { ...item, weight:Number(event.target.value) } : item))}/>
                    <button type="button" className="goalRemove" aria-label={t("goals.remove")}
                        onClick={() => setStages(current => current.filter((_, i) => i !== index))}><XIcon/></button>
                </div>)}
                <button type="button" className="goalQuietButton" onClick={() =>
                    setStages(current => [...current, { title:"", weight:1 }])}>
                    <PlusIcon/> {t("goals.addStage")}
                </button>
            </div>}
            <button type="button" className="addHabitSave goalSave" disabled={saving || !name.trim()} onClick={() => void save()}>
                {t("goals.save")}
            </button>
        </>}
    </div>;
}
