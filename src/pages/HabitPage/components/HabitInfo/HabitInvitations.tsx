import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";
import { Link } from "react-router-dom";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";

interface Invitation {
    habit_id: number;
    status: "pending" | "accepted";
    habit: { id: number; name: string } | null;
}

export default function HabitInvitations() {
    const { t } = useTranslation("common");
    const { refetchHabits } = useHabits();
    const { plans, refreshPlans } = usePlans();
    const pendingPlans = plans.filter(item => item.membership_status === "pending");
    const [ invitations, setInvitations ] = useState<Invitation[]>([]);
    const [ busy, setBusy ] = useState<number | null>(null);
    const [ error, setError ] = useState("");
    const [ planBusy, setPlanBusy ] = useState<number | null>(null);
    const [ planError, setPlanError ] = useState("");

    useEffect(() => {
        let active = true;
        api.get("habits/invitations").then(res => {
            if (active && res.data.success) setInvitations(res.data.invitations || []);
        }).catch(() => {
            if (active) setError(t("habitExtra.invitesFailed"));
        });
        return () => { active = false; };
    }, []);

    const respond = async (id: number, status: "accepted" | "declined") => {
        setBusy(id);
        setError("");
        try {
            const res = await api.patch(`habits/${id}/members/me`, { status });
            if (!res.data.success) throw new Error("Invitation update failed");
            await refetchHabits();
            setInvitations(previous => status === "accepted"
                ? previous.map(item => item.habit_id === id ? { ...item, status } : item)
                : previous.filter(item => item.habit_id !== id));
        } catch {
            setError(t("habitExtra.inviteActionFailed"));
        } finally {
            setBusy(null);
        }
    };

    const respondPlan = async (id: number, status: "accepted" | "declined") => {
        setPlanBusy(id);
        setPlanError("");
        try {
            const res = await api.post(`plans/${id}/respond`, { status });
            if (!res.data.success) throw new Error("Plan invitation update failed");
            await refreshPlans();
            window.dispatchEvent(new Event("plan-updated"));
        } catch {
            setPlanError(t("plans.inviteError"));
        } finally {
            setPlanBusy(null);
        }
    };

    if (!invitations.length && !error && !pendingPlans.length && !planError) return null;
    return <>
        {(invitations.length > 0 || error) && <section className="habitInvitations">
            <h3>{t("habitExtra.sharedActivities")}</h3>
            {error && <p role="alert">{error}</p>}
            {invitations.map(item => <div key={item.habit_id} className="habitInvitation">
                {item.status === "accepted" ? <Link to={`/habit/${item.habit_id}`}>{item.habit?.name || t("habitExtra.activity")}</Link> : <>
                    <span>{item.habit?.name || t("habitExtra.activity")}</span>
                    <button type="button" disabled={busy !== null} onClick={() => void respond(item.habit_id, "accepted")}>{t("habitExtra.accept")}</button>
                    <button type="button" disabled={busy !== null} onClick={() => void respond(item.habit_id, "declined")}>{t("habitExtra.decline")}</button>
                </>}
            </div>)}
        </section>}
        {(pendingPlans.length > 0 || planError) && <section className="habitInvitations planInvitations">
            <h3>{t("plans.invitationTitle")}</h3>
            {planError && <p role="alert">{planError}</p>}
            {pendingPlans.map(item => <div key={item.id} className="habitInvitation">
                <Link to={`/plan/${item.id}`}>{item.name}</Link>
                <button type="button" disabled={planBusy !== null} onClick={() => void respondPlan(item.id, "accepted")}>{t("plans.accept")}</button>
                <button type="button" disabled={planBusy !== null} onClick={() => void respondPlan(item.id, "declined")}>{t("plans.decline")}</button>
            </div>)}
        </section>}
    </>;
}
