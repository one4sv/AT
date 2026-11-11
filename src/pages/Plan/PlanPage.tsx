import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarBlankIcon, ClockIcon, MapPinIcon, UserPlusIcon, CheckCircleIcon, CircleIcon, ChatCenteredIcon } from "@phosphor-icons/react";
import { api } from "../../components/ts/api";
import { usePlans } from "../../components/hooks/PlansHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import type { OneOffPlan } from "../../components/context/PlansContext";
import PlanEditor, { type PlanInput } from "./PlanEditor";
import PlanReminders from "./PlanReminders";
import PlanComment from "./PlanComment";
import useCompactLayout from "../../components/hooks/utils/useCompactLayout";
import "./PlanPage.scss";

export default function PlanPage() {
    const { planId } = useParams<{ planId: string }>();
    const { t, i18n } = useTranslation("common");
    const navigate = useNavigate();
    const isCompact = useCompactLayout();
    const [mobileOpen, setMobileOpen] = useState<"done" | "comment">("done");
    const { refreshPlans } = usePlans();
    const { setTitle } = usePageTitle();
    const [plan, setPlan] = useState<OneOffPlan | null>(null);
    const [loading, setLoading] = useState(Boolean(planId));
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(!planId);
    const [invitedNick, setInvitedNick] = useState("");
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        setMobileOpen("done");
        setEditing(!planId);
        setPlan(null);
        setError("");
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
                setEditing(false);
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
    const formatDate = (date: string) => new Intl.DateTimeFormat(
        i18n.resolvedLanguage?.startsWith("en") ? "en-GB" : "ru-RU",
        { day:"numeric",month:"long",year:"numeric" }
    ).format(new Date(date + "T12:00:00"));

    const canComplete = !!plan && plan.membership_status === "accepted" && plan.status !== "canceled" &&
        (plan.is_owner || plan.completion_mode !== "shared");

    return <div className="planPage">
        {error && <div className="planError" role="alert">{error}</div>}
        {loading ? <div className="planSection">{t("plans.loading")}</div> :
            editing ? <div className="planSection">
                <h2>{planId ? t("plans.edit") : t("plans.create")}</h2>
                <PlanEditor initial={plan || undefined} saving={saving} onSave={save}
                    onClose={() => planId ? setEditing(false) : navigate("/habit")}/>
            </div> : plan ? <>
                <div className="planSection">
                    <div className="planHeading">
                        <h1>{plan.name}</h1>
                        <span className="planStatus">{t("plans." + (plan.status || "upcoming"))}</span>
                    </div>
                    <div className="planMetadata"><CalendarBlankIcon size={20}/>{formatDate(plan.plan_date)}</div>
                    {(plan.start_time || plan.end_time) && <div className="planMetadata">
                        <ClockIcon size={20}/>{[plan.start_time?.slice(0, 5),plan.end_time?.slice(0, 5)].filter(Boolean).join(" – ")}
                    </div>}
                    {plan.place && <div className="planMetadata"><MapPinIcon size={20}/>{plan.place}</div>}
                    {plan.description && <p className="planDescriptionText">{plan.description}</p>}
                    <div className="planMetadata">{t("plans." + plan.kind)}
                        {plan.kind === "shared" && plan.completion_mode && " · " + t("plans." + plan.completion_mode + "Completion")}
                    </div>
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
                    <div className="planSection planCompletionSection">
                        <h2>{t("plans.completion")}</h2>
                        {plan.kind === "shared" && plan.completion_mode === "personal" &&
                            <p>{(plan.completed_count || 0) + "/" + (plan.participants_count || 1)}</p>}
                        {!isCompact && <PlanComment planId={plan.id} disabled={plan.status === "canceled"}/>}
                        {canComplete && !isCompact && <button className="planPrimaryButton planDoneButton"
                            disabled={saving} onClick={() => void action(() => api.post("plans/" + planId + "/complete",
                                { completed: !plan.completed_for_me }))}>
                            {plan.completed_for_me ? <CheckCircleIcon size={20} weight="fill"/> : <CircleIcon size={20}/>}
                            {t(plan.completed_for_me ? "plans.undoCompletion" : "plans.markCompleted")}
                        </button>}
                    </div>
                    {plan.kind === "shared" && <div className="planSection">
                        <h2>{t("plans.members")}</h2>
                        <div className="planMembers">
                            {(plan.members || []).map(member => <div key={member.id} className="planMember">
                                <span>{member.username || member.nick}</span>
                                <span>{member.completed ? t("plans.completed") : t("plans.upcoming")}</span>
                            </div>)}
                        </div>
                        {plan.is_owner && plan.status === "upcoming" && <form className="planInvite" onSubmit={event => {
                            event.preventDefault();
                            void action(() => api.post("plans/" + planId + "/invite", { nick:invitedNick }))
                                .then(success => { if (success) setInvitedNick(""); });
                        }}>
                            <input required value={invitedNick} placeholder={t("plans.nick")}
                                onChange={event => setInvitedNick(event.target.value)}/>
                            <button className="planQuietButton" disabled={saving} type="submit">
                                <UserPlusIcon size={18}/>{t("plans.invite")}
                            </button>
                        </form>}
                    </div>}
                    {plan.is_owner && <div className="planSection">
                        <h2>{t("plans.management")}</h2>
                        <div className="planActions planManagementActions">
                            <button className="planQuietButton" disabled={saving} onClick={() => setEditing(true)}>
                                {t("plans.edit")}
                            </button>
                            <button className="planQuietButton" disabled={saving} onClick={() =>
                                void action(() => api.post("plans/" + planId + "/cancel",
                                    { cancel:plan.status !== "canceled" }))}>
                                {t(plan.status === "canceled" ? "plans.restore" : "plans.cancel")}
                            </button>
                            <button className="planQuietButton planDanger" onClick={() => setConfirmDelete(true)}>
                                {t("plans.delete")}
                            </button>
                        </div>
                        {confirmDelete && <div className="planDeleteConfirm">
                            <p>{t("plans.confirmDelete")}</p>
                            <div className="planActions">
                                <button className="planQuietButton" onClick={() => setConfirmDelete(false)}>{t("plans.back")}</button>
                                <button className="planPrimaryButton" disabled={saving} onClick={() =>
                                    void remove()}>{t("plans.delete")}</button>
                            </div>
                        </div>}
                    </div>}
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
                        {t(plan.completed_for_me ? "plans.undoCompletion" : "plans.markCompleted")}
                    </button>}
                </div>}
                <PlanComment planId={plan.id} mobile disabled={plan.status === "canceled"}
                    open={canComplete ? mobileOpen : "comment"} setOpen={setMobileOpen}/>
            </div>}
    </div>;
}
