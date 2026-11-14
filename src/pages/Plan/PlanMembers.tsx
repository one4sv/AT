import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserCircleIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
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
    
    const navigate = useNavigate()

    const remove = (id: string, name: string, pending: boolean) => setBlackout({
        seted: true,
        module: "ConfirmAction",
        confirmAction: {
            title: t(pending ? "plans.revokeInvitationConfirm" : "plans.removeParticipantConfirm", { name }),
            description: t(pending ? "plans.cannotAccept" : "plans.loseAccess", { name }),
            label: t(pending ? "plans.revokeInvitation" : "plans.removeParticipant"),
            run: async () => {
                const result = await api.delete("plans/" + plan.id + "/members/" + id);
                if (!result.data.success) throw new Error();
                await onChanged();
                showNotification("success", t(pending ? "plans.inviteRevoked" : "plans.memberRemoved"));
            }
        }
    });

    return <section className="planSection planMembersSection">
        <div className="planMembersHeader">
            <h2>{t("plans.members")}</h2>
            {plan.is_owner && plan.status === "upcoming" && <button type="button"
                className="planQuietButton"
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
                    <div className="planMember" onClick={() => navigate(`/acc/${member.nick}`)}>
                        <span className="planMemberAvatar">
                            {member.avatar_url ? <img src={member.avatar_url} alt="" loading="lazy"/> : <UserCircleIcon size={28}/>}
                        </span>
                        <div className="planMemberText">
                            <Link to={`/acc/${member.nick}`}>{name}</Link>
                            <span>{t(owner ? "plans.planOwner" : pending ? "plans.memberPending" :
                                member.completed ? "plans.completed" : "plans.memberAccepted")}</span>
                        </div>
                        {plan.is_owner && !owner && plan.status === "upcoming" && <button type="button"
                            className="planMemberRemove"
                            aria-label={t(pending ? "plans.revokeInvitation" : "plans.removeParticipant")}
                            onClick={event => {
                                event.stopPropagation();
                                remove(member.id, name, pending);
                            }}>
                            <XIcon size={20}/>
                        </button>}
                    </div>

                </div>;
            })}
        </div>
    </section>;
}
