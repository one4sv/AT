import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, MagnifyingGlassIcon, UserCircleIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
import axios from "axios";
import { useContacts } from "../../components/hooks/ContactsHook";
import { useNote } from "../../components/hooks/NoteHook";
import { api } from "../../components/ts/api";
import type { Contact } from "../../components/context/ContactsContext";
import type { OneOffPlan } from "../../components/context/PlansContext";

export default function PlanMembers({ plan, onChanged }: {
    plan: OneOffPlan;
    onChanged: () => Promise<void>;
}) {
    const { t } = useTranslation("common");
    const { findContacts } = useContacts();
    const findContactsRef = useRef(findContacts);
    findContactsRef.current = findContacts;
    const { showNotification } = useNote();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selected, setSelected] = useState<Contact | null>(null);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [working, setWorking] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!inviteOpen || !plan.is_owner) return;
        const controller = new AbortController();
        setLoadingContacts(true);
        const timer = window.setTimeout(() => {
            void findContactsRef.current(search, controller, "personal").then(result => {
                if (controller.signal.aborted) return;
                if (!result) {
                    setError(t("plans.contactsLoadError"));
                    setContacts([]);
                    return;
                }
                setContacts(result.filter(contact =>
                    !contact.is_group && contact.id !== plan.owner_id &&
                    !plan.members?.some(member => member.id === contact.id)
                ));
            }).catch(() => {
                if (!controller.signal.aborted) setError(t("plans.contactsLoadError"));
            }).finally(() => {
                if (!controller.signal.aborted) setLoadingContacts(false);
            });
        }, 150);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [inviteOpen, search, plan.owner_id, plan.is_owner, plan.members, t]);

    const errorText = (err: unknown, fallback: string) =>
        axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
            ? err.response.data.error : fallback;

    const invite = async () => {
        if (!selected || working) return;
        setWorking(true);
        setError("");
        try {
            const result = await api.post("plans/" + plan.id + "/invite", { nick: selected.nick });
            if (!result.data.success) throw new Error();
            await onChanged();
            setSelected(null);
            setSearch("");
            setInviteOpen(false);
            showNotification("success", t("plans.inviteSent"));
        } catch (err) {
            setError(errorText(err, t("plans.inviteError")));
        } finally {
            setWorking(false);
        }
    };

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
                onClick={() => { setInviteOpen(value => !value); setSelected(null); setError(""); }}>
                {inviteOpen ? <XIcon size={20}/> : <UserPlusIcon size={20}/>}
                {t(inviteOpen ? "plans.back" : "plans.addParticipant")}
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
        {inviteOpen && plan.is_owner && <div className="planInvite">
            <div className="planInviteSearch">
                <MagnifyingGlassIcon size={20}/>
                <input type="search" aria-label={t("plans.searchContacts")}
                    placeholder={t("plans.searchContacts")} value={search}
                    onChange={event => { setSearch(event.target.value); setSelected(null); setError(""); }}
                    disabled={working}/>
            </div>
            <div className="planInviteList">
                {loadingContacts ? <p>{t("plans.loadingContacts")}</p> :
                    contacts.length === 0 ? <p>{t("plans.noAvailableContacts")}</p> :
                    contacts.map(contact => <button type="button" key={contact.id}
                        className={`planInviteContact ${selected?.id === contact.id ? "selected" : ""}`}
                        disabled={working}
                        onClick={() => setSelected(previous => previous?.id === contact.id ? null : contact)}>
                        <span className="planMemberAvatar">
                            {contact.avatar_url ? <img src={contact.avatar_url} alt="" loading="lazy"/> : <UserCircleIcon size={24}/>}
                        </span>
                        <span>{contact.name || contact.nick}</span>
                        {selected?.id === contact.id && <CheckCircleIcon weight="fill" color="var(--accent_text)" size={20}/>}
                    </button>)}
            </div>
            <div className="planInviteActions">
                <button type="button" className="planQuietButton" disabled={working}
                    onClick={() => { setInviteOpen(false); setSelected(null); setError(""); }}>{t("plans.back")}</button>
                <button type="button" className="planPrimaryButton" disabled={!selected || working}
                    onClick={() => void invite()}><UserPlusIcon size={20}/>{t("plans.invite")}</button>
            </div>
        </div>}
        {error && <p role="alert" className="planInviteError">{error}</p>}
    </section>;
}
