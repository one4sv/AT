import { useEffect, useRef, useState } from "react";
import { api } from "../../../../components/ts/api";
import { useNote } from "../../../../components/hooks/NoteHook";
import type { GroupInviteRules } from "../../../../components/context/SettingsContext";
import { type Option } from "../../../../components/ts/SelectList";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import { type PrivateSettings } from "../../../../components/context/SettingsContext";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";
import { openCookiePreferences } from "../../../../components/ts/utils/cookieConsent";
import { useContacts } from "../../../../components/hooks/ContactsHook";
import type { Contact } from "../../../../components/context/ContactsContext";

export default function PrivacyTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { privateShow, groupInvites, refetchSettings, settingsLoaded } = useSettings();
    const { showNotification } = useNote();
    const { findContacts } = useContacts();
    const findContactsRef = useRef(findContacts);
    findContactsRef.current = findContacts;
    const [ activitySearch, setActivitySearch ] = useState("");
    const [ groupSearch, setGroupSearch ] = useState("");
    const [ activityContacts, setActivityContacts ] = useState<Contact[]>([]);
    const [ groupContacts, setGroupContacts ] = useState<Contact[]>([]);
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            findContactsRef.current(activitySearch, controller, "personal").then(result => {
                if (!controller.signal.aborted) setActivityContacts(result || []);
            }).catch(() => {});
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [activitySearch]);
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            findContactsRef.current(groupSearch, controller, "personal").then(result => {
                if (!controller.signal.aborted) setGroupContacts(result || []);
            }).catch(() => {});
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [groupSearch]);
    const [ savingInvites, setSavingInvites ] = useState(false);
    const [ visibleInvites, setVisibleInvites ] = useState(groupInvites);
    const [ visiblePrivate, setVisiblePrivate ] = useState(privateShow);
    useEffect(() => { setVisibleInvites(groupInvites); }, [groupInvites]);
    useEffect(() => { setVisiblePrivate(privateShow); }, [privateShow]);
    const savingRef = useRef(false);
    const inviteOptions = ["direct", "message", "none"].map(value => ({ value, label: t(`privacy.invites.${value}`) }));
    const saveInvites = async (rules: GroupInviteRules) => {
        if (savingRef.current || !settingsLoaded) return;
        savingRef.current = true;
        const previous = visibleInvites;
        setVisibleInvites(rules);
        setSavingInvites(true);
        try {
            const res = await api.post("updatesettings", { group_invites: rules });
            if (!res.data.success) throw new Error();
            await refetchSettings();
        } catch {
            setVisibleInvites(previous);
            showNotification("error", t("privacy.invites.saveError"));
        } finally {
            savingRef.current = false;
            setSavingInvites(false);
        }
    };
    const { setNewPrivateShow } = useUpSettings();

    const privateArr: Option[] = [
        { label: t("privacy.nobody"), value: "nobody" },
        { label: t("privacy.contacts"), value: "contacts" },
    ];

    const privateArrFull: Option[] = [
        ...privateArr,
        { label: t("privacy.all"), value: "all" },
    ];

    const applyNewPrivate = (setting: keyof PrivateSettings, value: string) => {
        if (!privateShow) return;
        const updated: PrivateSettings = { ...visiblePrivate, [setting]: value };
        setVisiblePrivate(updated);
        setNewPrivateShow(updated);
    };

    return (
        <div className="settingTab">
            {!search.trim() && <SectionArt theme="privacy"/>}
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("privacy.accountInfo")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPhone")} search={search} /></div>
                    <RadioGroup list={privateArr} val={visiblePrivate.number} newVal={(value) => applyNewPrivate("number", value || "nobody")} id="number"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesEmail")} search={search} /></div>
                    <RadioGroup list={privateArr} val={visiblePrivate.mail} newVal={(value) => applyNewPrivate("mail", value || "nobody")} id="mail"/>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("privacy.contentVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesActivities")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.habits} newVal={(value) => applyNewPrivate("habits", value || "nobody")} id="habits"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPosts")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={visiblePrivate.posts} newVal={(value) => applyNewPrivate("posts", value || "nobody")} id="posts"/>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">Приглашения в активности</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто может приглашать меня в активности</div>
                    <RadioGroup list={[
                        { label: t("privacy.all"), value: "all" },
                        { label: t("privacy.nobody"), value: "nobody" }
                    ]} val={visiblePrivate.activity_invites || "all"} newVal={value => applyNewPrivate("activity_invites", value || "all")} id="activityInvites"/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="activityInviteExceptions">
                <div className="settingHeader">Исключения приглашений в активности</div>
                <div className="settingHint">Исключения имеют приоритет над общим правилом. Разрешённые пользователи могут приглашать даже при выборе «Никто».</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Найти пользователя</div>
                    <input className="addHabitInput" value={activitySearch} placeholder="Поиск контакта" onChange={event => setActivitySearch(event.target.value)}/>
                    {activityContacts.slice(0, 12).map(contact => <div className="createChatContact" key={contact.id}>
                        <span>{contact.name || contact.nick}</span>
                        <RadioGroup id={`activityException-${contact.id}`} list={[
                            { label: "По общему правилу", value: "default" },
                            { label: "Разрешить", value: "allow" },
                            { label: "Запретить", value: "deny" }
                        ]} val={visiblePrivate.activity_invite_exceptions?.[contact.id] || "default"}
                            newVal={value => {
                                const exceptions = { ...(visiblePrivate.activity_invite_exceptions || {}) };
                                if (value === "allow" || value === "deny") exceptions[contact.id] = value;
                                else delete exceptions[contact.id];
                                const updated = { ...visiblePrivate, activity_invite_exceptions: exceptions };
                                setVisiblePrivate(updated);
                                setNewPrivateShow(updated);
                            }}/>
                    </div>)}
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="groupInvites">
                <div className="settingHeader"><HighlightText text={t("privacy.invites.title")} search={search}/></div>
                <div className="settingHint">{t("privacy.invites.hint")}</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.contacts")}</div>
                    <RadioGroup list={inviteOptions} val={visibleInvites.contacts} disabled={savingInvites || !settingsLoaded} id="groupInviteContacts" newVal={value => void saveInvites({ ...visibleInvites, contacts: value as GroupInviteRules["contacts"] })}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">{t("privacy.invites.others")}</div>
                    <RadioGroup list={inviteOptions} val={visibleInvites.others} disabled={savingInvites || !settingsLoaded} id="groupInviteOthers" newVal={value => void saveInvites({ ...visibleInvites, others: value as GroupInviteRules["others"] })}/>
                </div>

            </div>
            <div className="settingInnerDiv" data-setting-id="groupInviteExceptions">
                <div className="settingHeader">Исключения приглашений в беседы</div>
                <div className="settingHint">Разрешённые пользователи могут приглашать сообщением. Блокировка пользователя всегда имеет приоритет.</div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Найти пользователя</div>
                    <input className="addHabitInput" value={groupSearch} placeholder="Поиск контакта" onChange={event => setGroupSearch(event.target.value)}/>
                    {groupContacts.slice(0, 12).map(contact => <div className="createChatContact" key={contact.id}>
                        <span>{contact.name || contact.nick}</span>
                        <RadioGroup id={`groupException-${contact.id}`} list={[
                            { label: "По общему правилу", value: "default" },
                            { label: "Разрешить сообщением", value: "allow" },
                            { label: "Запретить", value: "deny" }
                        ]} val={visiblePrivate.group_invite_exceptions?.[contact.id] || "default"}
                            newVal={value => {
                                const exceptions = { ...(visiblePrivate.group_invite_exceptions || {}) };
                                if (value === "allow" || value === "deny") exceptions[contact.id] = value;
                                else delete exceptions[contact.id];
                                const updated = { ...visiblePrivate, group_invite_exceptions: exceptions };
                                setVisiblePrivate(updated);
                                setNewPrivateShow(updated);
                            }}/>
                    </div>)}
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="cookieConsent">
                <div className="settingHeader">
                    <HighlightText text={t("privacy.cookies")} search={search} />
                    <button type="button" className="securityAction" onClick={openCookiePreferences}>
                        {t("privacy.manageCookies")}
                    </button>
                </div>
                <span className="settingHint">{t("privacy.cookiesHint")}</span>
            </div>

        </div>
    );
}