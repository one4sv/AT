import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserCircleIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
import axios from "axios";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { useNote } from "../../components/hooks/NoteHook";
import { api } from "../../components/ts/api";
import type { OneOffPlan } from "../../components/context/PlansContext";

export default function PlanMembers({ plan, onChanged }: {
    plan: OneOffPlan;
    onChanged: () => Promise<void>;
}) {
    const { t } = useTranslation("common");
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [working, setWorking] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [error, setError] = useState("");

    const errorText = (err: unknown, fallback: string) =>
        axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
            ? err.response.data.error : fallback;

    const remove = async (id: string, pending: boolean) => {
        if (working) return;
        setWorking(true);
        setError("");
        try {
            const result = await api.delete("plans/" + plan.id + "/members/" + id);
            if (!result.data.success) throw new Error();
            await onChanged();
            setRemoving(null);
            showNotification("success", t(pending ? "plans.inviteRevoked" : "plans.memberRemoved"));
        } catch (err) {
            setError(errorText(err, t("plans.memberRemoveError")));
        } finally {
            setWorking(false);
        }
    };

    return <section className="planSection planMembersSection">
        <div className="planMembersHeader">
            <h2>{t("plans.members")}</h2>
            {plan.is_owner && plan.status === "upcoming" && <button type="button"
                className="planQuietButton" disabled={working}
                onClick={() => setBlackout({ seted: true, module: "HabitParticipantPicker",
                    point: "plan", options: { id: String(plan.id), name: plan.name } })}>
                <UserPlusIcon size={20}/>
                {t("plans.addParticipant")}
            </button>}
        </div>
        <p className="planMembersCount">{t("plans.participantsCount", {
            count: plan.participants_count || 1
        })}</p>
        <div className="planMembers">
            {(plan.members || []).map(member => {
                const owner = member.is_owner || member.id === plan.owner_id;
                const pending = member.status === "pending";
                const name = member.username || member.nick;
                return <div key={member.id}>
                    <div className="planMember">
                        <span className="planMemberAvatar">
                            {member.avatar_url ? <img src={member.avatar_url} alt="" loading="lazy"/> : <UserCircleIcon size={28}/>}
                        </span>
                        <div className="planMemberText">
                            <Link to={`/acc/${member.nick}`}>{name}</Link>
                            <span>{t(owner ? "plans.planOwner" : pending ? "plans.memberPending" :
                                member.completed ? "plans.completed" : "plans.memberAccepted")}</span>
                        </div>
                        {plan.is_owner && !owner && plan.status === "upcoming" && <button type="button"
                            className="planMemberRemove" disabled={working}
                            aria-label={t(pending ? "plans.revokeInvitation" : "plans.removeParticipant")}
                            onClick={() => setRemoving(current => current === member.id ? null : member.id)}>
                            <XIcon size={20}/>
                        </button>}
                    </div>
                    {removing === member.id && <div className="planMemberConfirm">
                        <span>{t(pending ? "plans.revokeInvitationConfirm" : "plans.removeParticipantConfirm", { name })}</span>
                        <div className="planInviteActions">
                            <button type="button" className="planQuietButton" disabled={working}
                                onClick={() => setRemoving(null)}>{t("plans.back")}</button>
                            <button type="button" className="planQuietButton planDanger" disabled={working}
                                onClick={() => void remove(member.id, pending)}>
                                {t(pending ? "plans.revokeInvitation" : "plans.removeParticipant")}
                            </button>
                        </div>
                    </div>}
                </div>;
            })}
        </div>
        {error && <p role="alert" className="planInviteError">{error}</p>}
    </section>;
}
