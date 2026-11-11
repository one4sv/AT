import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarBlankIcon, ClockIcon, MapPinIcon, CheckCircleIcon, CircleIcon, TrashIcon } from "@phosphor-icons/react";
import { api } from "../../components/ts/api";
import { usePlans } from "../../components/hooks/PlansHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useContextMenu } from "../../components/hooks/ContextMenuHook";
import type { MenuOptions } from "../../components/context/ContextMenuContext";
import type { OneOffPlan } from "../../components/context/PlansContext";
import PlanEditor, { type PlanInput } from "./PlanEditor";
import CalendarInput from "../../components/ts/CalendarInput";
import TA from "../../components/ts/TA";
import PlanReminders from "./PlanReminders";
import PlanComment from "./PlanComment";
import PlanMembers from "./PlanMembers";
import { tags } from "../../components/ts/tags";
import useCompactLayout from "../../components/hooks/utils/useCompactLayout";
import "./PlanPage.scss";

export default function PlanPage() {
    const { planId } = useParams<{ planId: string }>();
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const isCompact = useCompactLayout();
    const [mobileOpen, setMobileOpen] = useState<"done" | "comment">("done");
    const { refreshPlans } = usePlans();
    const { setTitle, setTitleIcon, setHeaderMenu } = usePageTitle();
    const { openMenu } = useContextMenu();
    const [plan, setPlan] = useState<OneOffPlan | null>(null);
    const [loading, setLoading] = useState(Boolean(planId));
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(!planId);
    const [draft, setDraft] = useState<PlanInput | null>(null);
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [tagOpen, setTagOpen] = useState(false);
    const [completionOpen, setCompletionOpen] = useState(false);

    useEffect(() => {
        setMobileOpen("done");
        setEditing(!planId);
        setDraft(null);
        setPlan(null);
        setError("");
        setConfirmDelete(false);
        setTagOpen(false);
        setCompletionOpen(false);
    }, [planId]);
    const load = async () => {
        if (!planId) return;
        setLoading(true);
        try {
            const res = await api.get("plans/" + planId);
            if (!res.data.success) throw new Error();
            setPlan(res.data.plan);
            setError("");
        } catch {
            setError(t("plans.loadError"));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId]);
    useEffect(() => {
        setTitle(plan?.name || (planId ? t("plans.title") : t("plans.create")));
    }, [planId, plan?.name, setTitle, t]);
    useEffect(() => {
        const Icon = tags.find(tag => tag.value === plan?.tag)?.icon;
        setTitleIcon(Icon ? <Icon size={24}/> : null);
        return () => setTitleIcon(null);
    }, [plan?.tag, setTitleIcon]);

    const startEditing = () => {
        if (!plan) return;
        setDraft({
            name: plan.name,
            description: plan.description || "",
            plan_date: plan.plan_date,
            start_time: plan.start_time?.slice(0, 5) || null,
            end_time: plan.end_time?.slice(0, 5) || null,
            timezone: plan.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
            place: plan.place || "",
            tag: plan.tag || null,
            kind: plan.kind,
            completion_mode: plan.completion_mode || "personal"
        });
        setTagOpen(false);
        setCompletionOpen(false);
        setEditing(true);
    };
    function changeDraft<K extends keyof PlanInput>(key: K, next: PlanInput[K]) {
        setDraft(previous => previous ? { ...previous, [key]: next } : previous);
    }
    const stopEditing = () => {
        setEditing(false);
        setDraft(null);
        setTagOpen(false);
        setCompletionOpen(false);
    };
    const localDate = (date: Date) => [date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")].join("-");

    const action = async (fn: () => Promise<unknown>) => {
        setSaving(true);
        setError("");
        try {
            await fn();
            await Promise.all([load(), refreshPlans()]);
            return true;
        } catch {
            setError(t("plans.saveError"));
            return false;
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!planId) return;
        setSaving(true);
        setError("");
        try {
            await api.delete("plans/" + planId);
            await refreshPlans();
            navigate("/habit");
        } catch {
            setError(t("plans.saveError"));
        } finally {
            setSaving(false);
        }
    };
    const save = async (input: PlanInput) => {
        setSaving(true);
        setError("");
        try {
            const payload = {
                ...input,
                ...(planId ? {} : { kind: input.kind }),
            };
            if (planId) {
                const { kind, ...changes } = payload;
                void kind;
                const result = await api.patch("plans/" + planId, changes);
                if (!result.data.success) throw new Error();
                stopEditing();
                await Promise.all([load(), refreshPlans()]);
            } else {
                const result = await api.post("plans", payload);
                if (!result.data.success) throw new Error();
                await refreshPlans();
                navigate("/plan/" + result.data.plan.id, { replace: true });
            }
        } catch {
            setError(t("plans.saveError"));
        } finally {
            setSaving(false);
        }
    };
    const selectedTag = tags.find(tag => tag.value === plan?.tag);
    const canComplete = !!plan && plan.membership_status === "accepted" && plan.status !== "canceled" &&
        (plan.is_owner || plan.completion_mode !== "shared");

    const menuHandlers = useRef({
        edit: startEditing,
        save: () => { if (draft) void save(draft); },
        stop: stopEditing,
        toggleCancel: () => { if (planId && plan) void action(() => api.post("plans/" + planId + "/cancel",
            { cancel: plan.status !== "canceled" })); },
        delete: () => setConfirmDelete(true)
    });
    menuHandlers.current = {
        edit: startEditing,
        save: () => { if (draft && draft.name.trim() && draft.plan_date && !saving) void save(draft); },
        stop: stopEditing,
        toggleCancel: () => { if (planId && plan && !saving) void action(() => api.post("plans/" + planId + "/cancel",
            { cancel: plan.status !== "canceled" })); },
        delete: () => setConfirmDelete(true)
    };
    const makePlanMenuOptions = (id: string, name: string, type: string, owner: boolean): MenuOptions => ({
        id, name, type, isMy: owner, disabled: saving,
        onEdit: () => menuHandlers.current.edit(),
        onSave: () => menuHandlers.current.save(),
        onStopEdit: () => menuHandlers.current.stop(),
        onToggleCancel: () => menuHandlers.current.toggleCancel(),
        onConfirmDelete: () => menuHandlers.current.delete()
    });
    useEffect(() => {
        if (plan?.is_owner && planId) {
            setHeaderMenu({ point: "plan", options: makePlanMenuOptions(planId, plan.name,
                editing ? "editing" : plan.status || "upcoming", true) });
        } else {
            setHeaderMenu(null);
        }
        return () => setHeaderMenu(null);
        // Header callbacks read menuHandlers.current so changing draft text does not rebuild the header.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId, plan?.id, plan?.name, plan?.is_owner, plan?.status, editing, saving, setHeaderMenu]);

    const openPlanMenu = (x: number, y: number) => {
        if (!plan?.is_owner || !planId || saving) return;
        openMenu(x, y, "plan", makePlanMenuOptions(planId, plan.name,
            editing ? "editing" : plan.status || "upcoming", true));
    };
    const readOnly = !editing || !draft;
    const value = (draft || plan)!;

    return <div className="planPage">
        {error && <div className="planError" role="alert">{error}</div>}
        {loading ? <div className="planSection">{t("plans.loading")}</div> :
            editing && !plan ? <div className="planSection">
                <h2>{planId ? t("plans.edit") : t("plans.create")}</h2>
                <PlanEditor initial={plan || undefined} saving={saving} onSave={save}
                    onClose={() => planId ? setEditing(false) : navigate("/habit")}/>
            </div> : plan ? <>
                <div className="planSection planMainSection"
                    data-context-menu={plan.is_owner ? "true" : undefined}
                    onContextMenu={event => {
                        if (editing && (event.target as Element).closest("input, textarea")) return;
                        if (plan.is_owner) {
                            event.preventDefault();
                            openPlanMenu(event.clientX, event.clientY);
                        }
                    }}>
                    <div className="planHeading">
                        <h1 className="planTitleWithIcon">
                            {selectedTag && <selectedTag.icon size={26}/>}
                            <input id="planInlineName" className="planDetailsInput planTitleInput"
                                aria-label={t("plans.name")} maxLength={160} required
                                readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                                value={value.name} onChange={event => changeDraft("name", event.target.value)}/>
                        </h1>
                        {plan.status && plan.status !== "upcoming" && <span className="planStatus">{t("plans." + plan.status)}</span>}
                    </div>
                    <div className="planMetadata">
                        <CalendarBlankIcon size={20}/>
                        <CalendarInput id="planInlineDate" className="planDetailsInput planDetailsDate"
                            readOnly={readOnly} dateFormat="d MMMM yyyy"
                            value={value.plan_date ? new Date(value.plan_date + "T12:00:00") : null}
                            onChange={date => changeDraft("plan_date", date ? localDate(date) : "")}/>
                    </div>
                    {(plan.start_time || plan.end_time || editing) && <div className="planMetadata planDetailsTimes">
                        <ClockIcon size={20}/>
                        <input id="planInlineStart" aria-label={t("plans.startTime")}
                            className="planDetailsInput" type="time"
                            readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                            value={value.start_time?.slice(0, 5) || ""}
                            onChange={event => changeDraft("start_time", event.target.value || null)}/>
                        <span>–</span>
                        <input id="planInlineEnd" aria-label={t("plans.endTime")}
                            className="planDetailsInput" type="time"
                            readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                            value={value.end_time?.slice(0, 5) || ""}
                            onChange={event => changeDraft("end_time", event.target.value || null)}/>
                    </div>}
                    {(plan.place || editing) && <div className="planMetadata">
                        <MapPinIcon size={20}/>
                        <input id="planInlinePlace" aria-label={t("plans.place")} className="planDetailsInput"
                            maxLength={500} readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                            placeholder={readOnly ? "" : t("plans.place")}
                            value={value.place} onChange={event => changeDraft("place", event.target.value)}/>
                    </div>}
                    {(plan.tag || editing) && <div className="planMetadata planTag planDetailsTag">
                        {(() => {
                            const tag = tags.find(item => item.value === value.tag);
                            return tag ? <><tag.icon size={20}/>{tag.label}</> : editing ? t("plans.tag") : null;
                        })()}
                        {editing && <button type="button" className="planTagEdit" aria-label={t("plans.tag")}
                            onClick={() => setTagOpen(previous => !previous)}>⋯</button>}
                        {editing && tagOpen && <div className="planTagChoices">
                            <button type="button" onClick={() => { changeDraft("tag", null); setTagOpen(false); }}>—</button>
                            {tags.map(tag => <button key={tag.value} type="button" onClick={() => {
                                changeDraft("tag", tag.value);
                                setTagOpen(false);
                            }}><tag.icon size={20}/>{tag.label}</button>)}
                        </div>}
                    </div>}
                    {(plan.description || editing) && <TA id="planInlineDescription"
                        className="planDetailsInput planDescriptionText planDetailsDescription"
                        aria-label={t("plans.description")} maxLength={1200} minHeight={0} maxHeight={22}
                        readOnly={readOnly} tabIndex={readOnly ? -1 : 0}
                        value={value.description || ""}
                        onChange={event => changeDraft("description", event.target.value)}/>}
                    <div className="planMetadata">{t("plans." + plan.kind)}
                        {plan.kind === "shared" && <>
                            {" · "}
                            <span className={editing ? "planCompletionModeEditable" : ""} onClick={() => {
                                if (editing) setCompletionOpen(previous => !previous);
                            }}>{t("plans." + (value.completion_mode || "personal") + "Completion")}</span>
                            {editing && completionOpen && <div className="planCompletionChoices">
                                {(["personal", "shared"] as const).map(mode => <button key={mode} type="button"
                                    onClick={() => { changeDraft("completion_mode", mode); setCompletionOpen(false); }}>
                                    {t(mode === "personal" ? "plans.individualCompletion" : "plans.sharedCompletion")}
                                </button>)}
                            </div>}
                        </>}
                    </div>
                    {confirmDelete && plan.is_owner && <div className="planDeleteConfirm">
                        <p>{t("plans.confirmDelete")}</p>
                        <div className="planActions">
                            <button className="planQuietButton" onClick={() => setConfirmDelete(false)}>{t("plans.back")}</button>
                            <button className="planQuietButton planDanger" disabled={saving}
                                onClick={() => void remove()}><TrashIcon size={20}/>{t("plans.delete")}</button>
                        </div>
                    </div>}
                    {!isCompact && plan.membership_status === "accepted" && <div className="planInlineCompletion">
                        <h2>{t("plans.completion")}</h2>
                        {plan.kind === "shared" && plan.completion_mode === "personal" &&
                            <p>{(plan.completed_count || 0) + "/" + (plan.participants_count || 1)}</p>}
                        <PlanComment planId={plan.id} disabled={plan.status === "canceled"}/>
                        {canComplete && <div className="doneButtDiv"><button className={"doneButt planDoneButton " +
                            (plan.completed_for_me ? "dbComp" : "dbMark")}
                            disabled={saving} onClick={() => void action(() => api.post("plans/" + planId + "/complete",
                                { completed: !plan.completed_for_me }))}>
                            {plan.completed_for_me ? <CheckCircleIcon size={20} weight="fill"/> : <CircleIcon size={20}/>}
                            {t(plan.completed_for_me ? "plans.undoCompletion" : "habitUi.complete")}
                        </button></div>}
                    </div>}
                </div>
                {plan.membership_status === "pending" ? <div className="planSection">
                    <p>{t("plans.invited")}</p>
                    <div className="planActions">
                        <button className="planPrimaryButton" disabled={saving} onClick={() =>
                            void action(() => api.post("plans/" + planId + "/respond", { status:"accepted" }))}>{t("plans.accept")}</button>
                        <button className="planQuietButton" disabled={saving} onClick={() =>
                            void action(() => api.post("plans/" + planId + "/respond", { status:"declined" }))}>{t("plans.decline")}</button>
                    </div>
                </div> : <>
                    <PlanReminders planId={plan.id}/>
                    <PlanMembers plan={plan} onChanged={async () => {
                        await Promise.all([load(), refreshPlans()]);
                    }}/>
                </>}
            </> : !error && <div className="planSection">{t("plans.notFound")}</div>}
        {isCompact && !editing && !loading && plan?.membership_status === "accepted" &&
            plan.status !== "canceled" && <div className="habitMobileDone planMobileDone">
                {canComplete && <div className={"doneButtDivMobile doable " + (mobileOpen === "done" ? "open" : "close")}>
                    {mobileOpen === "comment" ? <button type="button" className="bottomOpen"
                        aria-label={t("plans.completion")} onClick={() => setMobileOpen("done")}>
                        {plan.completed_for_me ? <CheckCircleIcon weight="fill" size={22}/> : <CircleIcon size={22}/>}
                    </button> : <button type="button" className="doneButtMobile" disabled={saving}
                        onClick={() => void action(() => api.post("plans/" + planId + "/complete",
                            { completed: !plan.completed_for_me }))}>
                        {plan.completed_for_me ? <CheckCircleIcon weight="fill" size={22}/> : <CircleIcon size={22}/>}
                        {t(plan.completed_for_me ? "plans.undoCompletion" : "habitUi.complete")}
                    </button>}
                </div>}
                <PlanComment planId={plan.id} mobile
                    open={canComplete ? mobileOpen : "comment"} setOpen={setMobileOpen}/>
            </div>}
    </div>;
}
