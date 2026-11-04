import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleUserRound, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../../../components/ts/api";
import { useContacts } from "../../../../components/hooks/ContactsHook";
import type { Contact } from "../../../../components/context/ContactsContext";
import type { GroupInviteRules, PrivateSettings } from "../../../../components/context/SettingsContext";
import "./PrivacyExceptions.scss";

type ExceptionType = NonNullable<PrivateSettings["activity_invite_exceptions"]>;
type ExceptionMode = "activity" | "group";

interface ExceptionUser {
    id: string;
    name: string | null;
    nick: string;
    avatar_url: string | null;
    is_contact: boolean;
    is_blocked: boolean;
}

interface Props {
    mode: ExceptionMode;
    exceptions: ExceptionType;
    activityRule: string;
    groupRules: GroupInviteRules;
    onChange: (next: ExceptionType) => void;
}

export default function PrivacyExceptions({ mode, exceptions, activityRule, groupRules, onChange }: Props) {
    const { t } = useTranslation("settings");
    const { findContacts } = useContacts();
    const findContactsRef = useRef(findContacts);
    findContactsRef.current = findContacts;

    const [ search, setSearch ] = useState("");
    const [ contacts, setContacts ] = useState<Contact[]>([]);
    const [ users, setUsers ] = useState<Record<string, ExceptionUser>>({});
    const [ loadingSearch, setLoadingSearch ] = useState(true);
    const [ loadingUsers, setLoadingUsers ] = useState(false);
    const [ loadError, setLoadError ] = useState(false);
    const [ retry, setRetry ] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoadingSearch(true);
            findContactsRef.current(search, controller, "personal").then(result => {
                if (!controller.signal.aborted) setContacts(result || []);
            }).catch(() => {
                if (!controller.signal.aborted) setContacts([]);
            }).finally(() => {
                if (!controller.signal.aborted) setLoadingSearch(false);
            });
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [search]);

    const selectedIds = Object.keys(exceptions);
    const idsKey = useMemo(() => [
        ...new Set([
            ...Object.keys(exceptions),
            ...contacts.filter(contact => !contact.is_group).slice(0, 40).map(contact => contact.id)
        ])
    ].slice(0, 100).sort().join(","), [contacts, exceptions]);

    useEffect(() => {
        if (!idsKey) {
            setLoadingUsers(false);
            return;
        }

        const controller = new AbortController();
        setLoadingUsers(true);
        setLoadError(false);

        api.post("settings/invite-exception-users", { user_ids: idsKey.split(",") }, { signal: controller.signal })
            .then(res => {
                if (controller.signal.aborted) return;
                if (!res.data?.success) throw new Error("User lookup failed");
                const next: Record<string, ExceptionUser> = {};
                for (const entry of res.data.users as ExceptionUser[]) next[entry.id] = entry;
                setUsers(previous => ({ ...previous, ...next }));
            })
            .catch(() => {
                if (!controller.signal.aborted) setLoadError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoadingUsers(false);
            });

        return () => controller.abort();
    }, [idsKey, retry]);

    const isAllowedByRule = (person: ExceptionUser) => {
        if (mode === "activity") {
            return activityRule === "all" || (activityRule === "contacts" && person.is_contact);
        }
        const rule = person.is_contact ? groupRules.contacts : groupRules.others;
        return rule !== "none";
    };

    const getEffectiveStatus = (person: ExceptionUser, exception?: ExceptionType[string]) => {
        const baseAllowed = isAllowedByRule(person);
        if (person.is_blocked) return false;
        if (exception === "invert") return !baseAllowed;
        if (exception === "allow") return true;
        if (exception === "deny") return false;
        return baseAllowed;
    };

    const toggle = (id: string) => {
        const next = { ...exceptions };
        if (Object.prototype.hasOwnProperty.call(next, id)) {
            delete next[id];
        } else {
            if (selectedIds.length >= 100 || !users[id] || users[id].is_blocked) return;
            next[id] = "invert";
        }
        onChange(next);
    };

    const renderUser = (person: ExceptionUser, selected: boolean) => {
        const exception = exceptions[person.id];
        const effectiveAllowed = getEffectiveStatus(person, exception);
        const newAllowed = !isAllowedByRule(person);
        const unavailable = person.is_blocked || (!selected && selectedIds.length >= 100);

        return (
            <div className={`privacyExceptionUser ${selected ? "selected" : ""}`} key={person.id}>
                <div className="privacyExceptionAvatar">
                    {person.avatar_url
                        ? <img src={person.avatar_url} alt=""/>
                        : <CircleUserRound aria-hidden="true"/>
                    }
                </div>
                <div className="privacyExceptionIdentity">
                    <span className="privacyExceptionName">{person.name || person.nick}</span>
                    <span className="privacyExceptionMeta">
                        {person.is_blocked
                            ? t("privacy.exceptions.blocked")
                            : selected
                                ? t(effectiveAllowed ? "privacy.exceptions.allowed" : "privacy.exceptions.denied")
                                : `@${person.nick}`
                        }
                    </span>
                </div>
                <button
                    type="button"
                    className={`privacyExceptionAction ${selected ? "remove" : newAllowed ? "allow" : "deny"}`}
                    disabled={unavailable && !selected}
                    onClick={() => toggle(person.id)}
                    aria-label={selected
                        ? t("privacy.exceptions.remove")
                        : t(newAllowed ? "privacy.exceptions.allow" : "privacy.exceptions.deny")
                    }
                >
                    {selected ? <X size={18}/> : newAllowed ? <Check size={18}/> : <X size={18}/>}
                    <span>{selected
                        ? t("privacy.exceptions.remove")
                        : t(newAllowed ? "privacy.exceptions.allow" : "privacy.exceptions.deny")
                    }</span>
                </button>
            </div>
        );
    };

    const selectedUsers = selectedIds.map(id => users[id]).filter((person): person is ExceptionUser => Boolean(person));
    const visibleContacts = contacts.filter(person => !person.is_group && !Object.prototype.hasOwnProperty.call(exceptions, person.id))
        .slice(0, 12);
    const availableUsers = visibleContacts.map(contact => users[contact.id]).filter((person): person is ExceptionUser => Boolean(person));

    return (
        <div className="privacyExceptions" data-setting-id={mode === "activity" ? "activityInviteExceptions" : "groupInviteExceptions"}>
            <div className="settingHint">{t("privacy.exceptions.hint")}</div>

            {selectedIds.length > 0 && (
                <div className="privacyExceptionSection">
                    <div className="privacyExceptionLabel">
                        {t("privacy.exceptions.selected", { count: selectedIds.length })}
                    </div>
                    <div className="privacyExceptionList">
                        {selectedUsers.map(person => renderUser(person, true))}
                        {selectedUsers.length < selectedIds.length && (
                            <div className="privacyExceptionEmpty">{t("privacy.exceptions.loading")}</div>
                        )}
                    </div>
                </div>
            )}

            <div className="privacyExceptionSection">
                <label className="privacyExceptionLabel" htmlFor={`privacyExceptionSearch-${mode}`}>
                    {t("privacy.exceptions.find")}
                </label>
                <div className="privacyExceptionSearch">
                    <Search size={20} aria-hidden="true"/>
                    <input
                        id={`privacyExceptionSearch-${mode}`}
                        value={search}
                        placeholder={t("privacy.exceptions.search")}
                        onChange={event => setSearch(event.target.value)}
                        autoComplete="off"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch("")} aria-label={t("privacy.exceptions.clearSearch")}>
                            <X size={18}/>
                        </button>
                    )}
                </div>
                {loadError && (
                    <button type="button" className="privacyExceptionRetry" onClick={() => setRetry(value => value + 1)}>
                        {t("privacy.exceptions.retry")}
                    </button>
                )}
                <div className="privacyExceptionList">
                    {availableUsers.map(person => renderUser(person, false))}
                    {(loadingSearch || loadingUsers) && availableUsers.length === 0 && (
                        <div className="privacyExceptionEmpty">{t("privacy.exceptions.loading")}</div>
                    )}
                    {!loadingSearch && !loadingUsers && !loadError && availableUsers.length === 0 && (
                        <div className="privacyExceptionEmpty">
                            {t(search ? "privacy.exceptions.notFound" : "privacy.exceptions.noContacts")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
