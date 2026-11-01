import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, XIcon, ArrowClockwiseIcon, FlagIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { api } from "../../../components/ts/api";
import { tags } from "../../../components/ts/tags";
import { useHabits } from "../../../components/hooks/HabitsHook";
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
    status: "pending" | "accepted" | "declined" | "cancelled";
    can_respond: boolean;
}

export default function HabitInvitation({ messageId, recipientId }: { messageId: number; recipientId: string }) {
    const [ invitation, setInvitation ] = useState<Invitation | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ saving, setSaving ] = useState(false);
    const [ error, setError ] = useState("");
    const request = useRef<AbortController | null>(null);
    const submitting = useRef(false);
    const { refetchHabits } = useHabits();

    const load = useCallback(async () => {
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        try {
            const res = await api.get(`messages/${messageId}/habit-invitation`, { signal: controller.signal });
            if (controller.signal.aborted) return;
            if (!res.data.success) throw new Error();
            setInvitation(res.data.invitation);
            setError("");
        } catch {
            if (!controller.signal.aborted) setError("Не удалось загрузить приглашение");
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, [messageId, recipientId]);

    useEffect(() => {
        setInvitation(null);
        setLoading(true);
        void load();
        const refresh = (event: Event) => {
            if ((event as CustomEvent<number>).detail === messageId) void load();
        };
        const onFocus = () => { void load(); };
        window.addEventListener("habit-invitation-updated", refresh);
        window.addEventListener("focus", onFocus);
        return () => {
            request.current?.abort();
            window.removeEventListener("habit-invitation-updated", refresh);
            window.removeEventListener("focus", onFocus);
        };
    }, [load, messageId]);

    const respond = async (status: "accepted" | "declined") => {
        if (!invitation?.can_respond || submitting.current) return;
        submitting.current = true;
        setSaving(true);
        try {
            const res = await api.patch(`habits/${invitation.habit.id}/members/me`, { status, message_id: messageId });
            if (!res.data.success) throw new Error();
            setInvitation(current => current ? { ...current, status: res.data.status, can_respond: false } : current);
            setError("");
            window.dispatchEvent(new CustomEvent("habit-invitation-updated", { detail: messageId }));
            window.dispatchEvent(new Event("habit-members-updated"));
            if (status === "accepted") await refetchHabits();
        } catch {
            await load();
            setError("Не удалось ответить на приглашение. Попробуйте ещё раз.");
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };

    const Icon = tags.find(tag => tag.value === invitation?.habit.tag)?.icon || FlagIcon;
    const time = [invitation?.habit.start_time, invitation?.habit.end_time].filter(Boolean).join(" — ");
    const statusText = invitation?.status === "accepted" ? "Приглашение принято" : invitation?.status === "declined" ? "Приглашение отклонено" : invitation?.status === "cancelled" ? "Приглашение отменено" : "Ожидает ответа";

    return (
        <div className="habitInvitation" onDoubleClick={event => event.stopPropagation()}>
            <div className="habitInvitationTitle">Приглашение в активность</div>
            {loading && <div role="status">Загрузка…</div>}
            {invitation && <>
                <Link className="habit habitInvitationHabit" to={`/habit/${invitation.habit.id}`}>
                    <div className="habitIcon"><Icon className="habitIconSvg" /></div>
                    <div className="habitInfo">
                        <div className="habitName">{invitation.habit.name}</div>
                        <div className="habitPer">{time || (invitation.habit.periodicity === "everyday" ? "Каждый день" : "Совместная активность")}</div>
                    </div>
                </Link>
                {invitation.can_respond ? <div className="habitInvitationActions">
                    <button type="button" className="habitInvationButt cancel" disabled={saving} onClick={() => void respond("declined")}><XIcon size={18}/>Отклонить</button>
                    <button type="button" className="habitInvationButt accept" disabled={saving} onClick={() => void respond("accepted")}><CheckIcon size={18}/>Принять</button>
                </div> : <div className="habitInvitationStatus" role="status">{statusText}</div>}
            </>}
            {error && <div className="habitInvitationError" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => void load()} aria-label="Повторить загрузку"><ArrowClockwiseIcon /></button>
            </div>}
        </div>
    );
}
