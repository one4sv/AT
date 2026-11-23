import "./goalTranslations";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlusIcon, PencilSimpleIcon, TrashIcon, XIcon, CheckIcon } from "@phosphor-icons/react";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { useNote } from "../../components/hooks/NoteHook";
import { useHabits } from "../../components/hooks/HabitsHook";
import { usePlans } from "../../components/hooks/PlansHook";
import { useUser } from "../../components/hooks/UserHook";
import { api } from "../../components/ts/api";
import SelectList from "../../components/ts/SelectList";
import Checkbox from "../../components/ts/utils/Checkbox";
import type { Goal } from "./types";
import "./scss/GoalsPage.scss";

export default function GoalPage() {
    const { goalId } = useParams<{ goalId:string }>();
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { user } = useUser();
    const { setTitle } = usePageTitle();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const { habits } = useHabits();
    const { plans } = usePlans();
    const [goal, setGoal] = useState<Goal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newStage, setNewStage] = useState("");
    const [newWeight, setNewWeight] = useState(1);
    const [progressInput, setProgressInput] = useState(0);
    const [habitId, setHabitId] = useState("");
    const [planId, setPlanId] = useState("");
    const [editStageId, setEditStageId] = useState<number | null>(null);
    const [stageTitle, setStageTitle] = useState("");
    const [stageWeight, setStageWeight] = useState(1);

    const refresh = useCallback(async () => {
        if (!goalId || !user.id) return;
        const { data } = await api.get<{success:boolean; goal:Goal}>("goals/" + goalId);
        if (!data.success) throw new Error("Goal unavailable");
        setGoal(data.goal);
        setProgressInput(Number(data.goal.progress_mode === "manual" ?
            data.goal.manual_progress : data.goal.metric_current));
        setError(false);
    }, [goalId, user.id]);

    useEffect(() => {
        setGoal(null);
        setLoading(true);
        void refresh().catch(() => setError(true)).finally(() => setLoading(false));
    }, [refresh]);
    useEffect(() => { setTitle(goal?.name || t("goals.title")); }, [setTitle,goal?.name,t]);
    useEffect(() => {
        const listener = () => { void refresh().catch(() => setError(true)); };
        window.addEventListener("goals-updated", listener);
        return () => window.removeEventListener("goals-updated", listener);
    }, [refresh]);

    const mutate = async (url:string, method:"post"|"patch"|"delete", body?:object) => {
        if (saving) return;
        setSaving(true);
        try {
            const response = method === "post" ? await api.post(url,body) :
                method === "patch" ? await api.patch(url,body) : await api.delete(url);
            if (!response.data?.success) throw new Error("Request rejected");
            if (response.data.goal) {
                setGoal(response.data.goal);
                setProgressInput(Number(response.data.goal.progress_mode === "manual" ?
                    response.data.goal.manual_progress : response.data.goal.metric_current));
            } else await refresh();
            window.dispatchEvent(new Event("goals-updated"));
            return true;
        } catch {
            showNotification("error", t("goals.saveError"));
            return false;
        } finally { setSaving(false); }
    };

    const addStage = async () => {
        if (!newStage.trim() || newWeight <= 0) return;
        if (await mutate("goals/" + goalId + "/milestones","post",{ title:newStage.trim(), weight:newWeight })) {
            setNewStage("");
            setNewWeight(1);
        }
    };
    const deleteGoal = () => setBlackout({ seted:true, module:"ConfirmAction", confirmAction:{
        title:t("goals.delete"),
        description:t("goals.deleteConfirm"),
        label:t("goals.delete"),
        variant:"danger",
        run:async () => {
            const { data } = await api.delete("goals/" + goalId);
            if (!data.success) throw new Error("Goal not deleted");
            navigate("/goals");
            window.dispatchEvent(new Event("goals-updated"));
        }
    }});
    const setStatus = (status:string) => {
        if (status === "completed") {
            setBlackout({ seted:true, module:"ConfirmAction", confirmAction:{
                title:t("goals.complete"),
                description:t("goals.completeConfirm"),
                label:t("goals.complete"),
                variant:"approve",
                run:async () => { if (!await mutate("goals/" + goalId,"patch",{status})) throw new Error("Save failed"); }
            }});
            return;
        }
        void mutate("goals/" + goalId,"patch",{status});
    };
    const availableHabits = (habits || []).filter(habit => habit.user_id === user.id &&
        !(goal?.habits || []).some(link => String(link.id) === String(habit.id)));
    const availablePlans = plans.filter(plan => plan.is_owner &&
        !(goal?.plans || []).some(link => String(link.id) === String(plan.id)));
    const statusOptions = ["draft","active","paused","completed","canceled","archived"].map(status => ({
        value:status,label:t("goals.status." + status)
    }));

    if (loading) return <div className="goalsPage">{t("goals.loading")}</div>;
    if (error || !goal) return <div className="goalsPage">{t("goals.loadError")}</div>;

    return <div className="goalsPage goalDetail">
        <div className="goalsHeading">
            <div><Link to="/goals" className="goalBack">{t("goals.title")}</Link><h1>{goal.name}</h1></div>
            <div className="goalActions">
                <button type="button" className="goalQuietButton" onClick={() =>
                    setBlackout({ seted:true,module:"AddGoal",options:{id:String(goal.id)} })}>
                    <PencilSimpleIcon/>{t("goals.edit")}
                </button>
                <button type="button" className="goalQuietButton danger" onClick={deleteGoal}><TrashIcon/></button>
            </div>
        </div>
        <section className="goalSection">
            <p className="goalDescriptionText">{goal.description || t("goals.noDescription")}</p>
            <div className="goalMeta">{t("goals.dueDate")}: {goal.due_date || t("goals.noDueDate")}</div>
            <div className="goalMeta">{t("goals.statusLabel")}</div>
            <SelectList id="goalStatus" className="goalStatusSelect" arr={statusOptions} selected={goal.status}
                onChange={setStatus} readOnly/>
            <div className="goalProgressHeader"><h2>{t("goals.progress")}</h2><strong>{goal.progress}%</strong></div>
            <div className="goalProgressTrack"><div style={{width:goal.progress + "%"}}/></div>
            {(goal.progress_mode === "manual" || goal.progress_mode === "metric" ||
                goal.progress_mode === "combined") && <div className="goalProgressEdit">
                <label htmlFor="goalValue">{goal.progress_mode === "manual" ?
                    t("goals.progress") + " %" : t("goals.current") + (goal.metric_unit ? " (" + goal.metric_unit + ")" : "")}</label>
                <input id="goalValue" type="number" value={progressInput}
                    min={goal.progress_mode === "manual" ? 0 : undefined}
                    max={goal.progress_mode === "manual" ? 100 : undefined}
                    onChange={event => setProgressInput(Number(event.target.value))}/>
                <button className="planPrimaryButton" type="button" disabled={saving} onClick={() =>
                    void mutate("goals/" + goalId,"patch",goal.progress_mode === "manual" ?
                        { manual_progress:progressInput } : { metric_current:progressInput })}>
                    <CheckIcon/>{t("goals.save")}
                </button>
            </div>}
            {goal.progress_mode !== "manual" && goal.progress_mode !== "milestones" &&
                <p className="goalMeta">{t("goals.metric")}: {Number(goal.metric_current)} / {Number(goal.metric_target)} {goal.metric_unit}</p>}
            {goal.progress_mode === "combined" && <p className="goalMeta">{t("goals.metricShare")}: {Math.round(Number(goal.metric_share) * 100)}%</p>}
        </section>
        <section className="goalSection">
            <h2>{t("goals.stages")} ({(goal.milestones || []).filter(s => s.completed_at).length}/{goal.milestones?.length || 0})</h2>
            {(goal.milestones || []).map(stage => <div className="goalStage" key={stage.id}>
                <Checkbox state={Boolean(stage.completed_at)} disable={saving} func={checked =>
                    void mutate("goals/" + goalId + "/milestones/" + stage.id,"patch",{completed:checked})}/>
                {editStageId === stage.id ? <>
                    <input value={stageTitle} maxLength={160} onChange={event => setStageTitle(event.target.value)}/>
                    <input type="number" min={0.001} step={0.5} value={stageWeight}
                        onChange={event => setStageWeight(Number(event.target.value))}/>
                    <button type="button" className="goalQuietButton" disabled={saving} onClick={async () => {
                        if (stageWeight <= 0 || !stageTitle.trim()) return;
                        if (await mutate("goals/" + goalId + "/milestones/" + stage.id,"patch",
                            {title:stageTitle.trim(),weight:stageWeight})) setEditStageId(null);
                    }}><CheckIcon/></button>
                </> : <>
                    <span className={stage.completed_at ? "goalStageCompleted" : ""}>{stage.title}</span>
                    <small>{t("goals.weight")}: {Number(stage.weight)}</small>
                    <button type="button" className="goalQuietButton" onClick={() => {
                        setEditStageId(stage.id);
                        setStageTitle(stage.title);
                        setStageWeight(Number(stage.weight));
                    }}><PencilSimpleIcon/></button>
                </>}
                <button type="button" className="goalQuietButton danger" disabled={saving}
                    onClick={() => void mutate("goals/" + goalId + "/milestones/" + stage.id,"delete")}><XIcon/></button>
            </div>)}
            <div className="goalStageDraft">
                <input value={newStage} maxLength={160} placeholder={t("goals.stageName")}
                    onChange={event => setNewStage(event.target.value)}/>
                <input type="number" min={0.001} step={0.5} value={newWeight} aria-label={t("goals.weight")}
                    onChange={event => setNewWeight(Number(event.target.value))}/>
                <button type="button" className="goalQuietButton" disabled={saving || !newStage.trim()}
                    onClick={() => void addStage()}><PlusIcon/>{t("goals.addStage")}</button>
            </div>
        </section>
        <section className="goalSection">
            <h2>{t("goals.linkedHabits")}</h2>
            {(goal.habits || []).map(item => <div className="goalLink" key={item.id}>
                <Link to={"/habit/" + item.id}>{item.name}</Link>
                <button type="button" className="goalQuietButton" disabled={saving}
                    onClick={() => void mutate("goals/" + goalId + "/links/habit/" + item.id,"delete")}><XIcon/></button>
            </div>)}
            <div className="goalLinkAdd">
                <SelectList className="goalLinkSelect" selected={habitId} onChange={setHabitId}
                    arr={availableHabits.map(item => ({value:String(item.id),label:item.name}))}
                    placeholder={t("goals.chooseHabit")}/>
                <button type="button" className="goalQuietButton" disabled={saving || !habitId}
                    onClick={() => { void mutate("goals/" + goalId + "/links","post",{kind:"habit",id:Number(habitId)})
                        .then(done => { if (done) setHabitId(""); }); }}><PlusIcon/></button>
            </div>
            <h2>{t("goals.linkedPlans")}</h2>
            {(goal.plans || []).map(item => <div className="goalLink" key={item.id}>
                <Link to={"/plan/" + item.id}>{item.name}</Link>
                <button type="button" className="goalQuietButton" disabled={saving}
                    onClick={() => void mutate("goals/" + goalId + "/links/plan/" + item.id,"delete")}><XIcon/></button>
            </div>)}
            <div className="goalLinkAdd">
                <SelectList className="goalLinkSelect" selected={planId} onChange={setPlanId}
                    arr={availablePlans.map(item => ({value:String(item.id),label:item.name}))}
                    placeholder={t("goals.choosePlan")}/>
                <button type="button" className="goalQuietButton" disabled={saving || !planId}
                    onClick={() => { void mutate("goals/" + goalId + "/links","post",{kind:"plan",id:Number(planId)})
                        .then(done => { if (done) setPlanId(""); }); }}><PlusIcon/></button>
            </div>
        </section>
        {!!goal.events?.length && <section className="goalSection">
            <h2>{t("goals.history")}</h2>
            {goal.events.map(event => <div className="goalEvent" key={event.id}>
                <span>{t("goals.event." + event.action, {defaultValue:event.action})}</span>
                <time>{new Date(event.created_at).toLocaleString()}</time>
            </div>)}
        </section>}
    </div>;
}
