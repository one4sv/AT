import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, XIcon, ArrowClockwiseIcon, FlagIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { api } from "../../../components/ts/api";
import { tags } from "../../../components/ts/tags";
import { useHabits } from "../../../components/hooks/HabitsHook";
import { usePlans } from "../../../components/hooks/PlansHook";
import "../scss/HabitInvitation.scss";

interface Invitation {
    habit: {
        id: number;
        name: string;
        tag: string | null;
        start_time: string | null;
        end_time: string | null;
        periodicity: string;
        ongoing: boolean;
    };
    plan?: {
        id: number;
        name: string;
        tag: string | null;
        plan_date: string;
        start_time: string | null;
        end_time: string | null;
    };
    status: "pending" | "accepted" | "declined" | "cancelled";
    can_respond: boolean;
}

export default function HabitInvitation({ messageId, recipientId, kind = "habit" }: {
    messageId: number; recipientId: string; kind?: "habit" | "plan"
}) {
    const { t } = useTranslation("common");
    const [ invitation, setInvitation ] = useState<Invitation | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ saving, setSaving ] = useState(false);
    const [ error, setError ] = useState("");
    const request = useRef<AbortController | null>(null);
    const submitting = useRef(false);
    const { refetchHabits } = useHabits();
    const { refreshPlans } = usePlans();

    const load = useCallback(async () => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        try {
            const res = await api.get(`messages/${messageId}/${kind}-invitation`, { signal: controller.signal });
            if (controller.signal.aborted) return;
            if (!res.data.success) throw new Error();
            setInvitation(res.data.invitation);
            setError("");
        } catch {
            if (!controller.signal.aborted) setError(t("chatMenu.invitationLoadFailed"));
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [messageId, recipientId, kind]);

    useEffect(() => {
        setInvitation(null);
        setLoading(true);
        void load();
        const refresh = (event: Event) => {
            if ((event as CustomEvent<number>).detail === messageId) void load();
        };
        const onFocus = () => { void load(); };
        window.addEventListener(`${kind}-invitation-updated`, refresh);
        window.addEventListener("focus", onFocus);
        return () => {
            request.current?.abort();
            window.removeEventListener(`${kind}-invitation-updated`, refresh);
            window.removeEventListener("focus", onFocus);
        };
    }, [load, messageId, kind]);

    const respond = async (status: "accepted" | "declined") => {
        if (!invitation?.can_respond || submitting.current) return;
        submitting.current = true;
        setSaving(true);
        try {
            const res = kind === "plan" ? await api.post(`plans/${invitation.plan!.id}/respond`,
                { status, message_id: messageId }) :
                await api.patch(`habits/${invitation.habit.id}/members/me`, { status, message_id: messageId });
            if (!res.data.success) throw new Error();
            setInvitation(current => current ? { ...current, status: res.data.status, can_respond: false } : current);
            setError("");
            window.dispatchEvent(new CustomEvent(`${kind}-invitation-updated`, { detail: messageId }));
            window.dispatchEvent(new Event(kind === "plan" ? "plan-members-updated" : "habit-members-updated"));
            if (kind === "plan") await refreshPlans();
            else if (status === "accepted") await refetchHabits();
        } catch {
            await load();
            setError(t("chatMenu.invitationRespondFailed"));
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };

    const subject = kind === "plan" ? invitation?.plan : invitation?.habit;
    const Icon = tags.find(tag => tag.value === subject?.tag)?.icon || FlagIcon;
    const time = kind === "plan" ?
        [invitation?.plan?.plan_date, invitation?.plan?.start_time, invitation?.plan?.end_time].filter(Boolean).join(" · ") :
        [invitation?.habit?.start_time, invitation?.habit?.end_time].filter(Boolean).join(" — ");
    const statusText = invitation?.status === "accepted" ? t("chatMenu.invitationAccepted") : invitation?.status === "declined" ? t("chatMenu.invitationDeclined") : invitation?.status === "cancelled" ? t("chatMenu.invitationCancelled") : t("chatMenu.invitationPending");

    return (
        <div className="habitInvitation" onDoubleClick={event => event.stopPropagation()}>
            <div className="habitInvitationTitle">{t(kind === "plan" ? "chatMenu.planInvitationTitle" : "chatMenu.invitationTitle")}</div>
            {loading && <div role="status">{t("chatMenu.loading")}</div>}
            {invitation && <>
                {subject && <Link className="habit habitInvitationHabit" to={kind === "plan" ? `/plan/${subject.id}` : `/habit/${subject.id}`}>
                    <div className="habitIcon"><Icon className="habitIconSvg" /></div>
                    <div className="habitInfo">
                        <div className="habitName">{subject.name}</div>
                        <div className="habitPer">{time || (kind === "habit" && invitation.habit?.periodicity === "everyday" ?
                            t("habitUi.period.everyday") : t(kind === "plan" ? "plans.title" : "chatMenu.sharedActivity"))}</div>
                    </div>
                </Link>}
                {invitation.can_respond ? <div className="habitInvitationActions">
                    <button type="button" className="habitInvationButt cancel" disabled={saving} onClick={() => void respond("declined")}><XIcon size={18}/>{t("chatMenu.decline")}</button>
                    <button type="button" className="habitInvationButt accept" disabled={saving} onClick={() => void respond("accepted")}><CheckIcon size={18}/>{t("chatMenu.accept")}</button>
                </div> : <div className="habitInvitationStatus" role="status">{statusText}</div>}
            </>}
            {error && <div className="habitInvitationError" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => void load()} aria-label={t("chatMenu.retry")}><ArrowClockwiseIcon /></button>
            </div>}
        </div>
    );
}
